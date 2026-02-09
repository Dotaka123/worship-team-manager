import express from 'express';
import Cotisation from '../models/Cotisation.js';
import Member from '../models/Member.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Fonction helper pour générer les cotisations manquantes
const generateMissingCotisations = async (mois) => {
  // Cherche tous les membres actifs (insensible à la casse)
  const activeMembers = await Member.find({
    status: { $in: ['actif', 'Actif'] }
  });

  let created = 0;

  for (const member of activeMembers) {
    // Vérifie si ce membre a déjà une cotisation pour ce mois
    const existing = await Cotisation.findOne({ 
      membre: member._id, 
      mois 
    });

    if (!existing) {
      await Cotisation.create({
        membre: member._id,
        mois,
        montant: 3000,
        statut: 'non_paye'
      });
      created++;
    }
  }

  return created;
};

// Générer les cotisations pour un mois
router.post('/generate', auth, async (req, res) => {
  try {
    const { mois } = req.body;

    if (!mois) {
      return res.status(400).json({ message: 'Mois requis' });
    }

    const created = await generateMissingCotisations(mois);

    res.json({
      message: `${created} cotisations générées`,
      created
    });
  } catch (error) {
    console.error('Erreur génération cotisations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les cotisations d'un mois
router.get('/month/:mois', auth, async (req, res) => {
  try {
    const { mois } = req.params;

    // Génère automatiquement les cotisations manquantes
    await generateMissingCotisations(mois);

    // Récupère toutes les cotisations du mois
    const cotisations = await Cotisation.find({ mois })
      .populate('membre', 'firstName lastName role instrument status')
      .sort({ 'membre.firstName': 1 });

    // Filtre seulement les membres actifs
    const filtered = cotisations.filter(c => 
      c.membre && ['actif', 'Actif'].includes(c.membre.status)
    );

    res.json(filtered);
  } catch (error) {
    console.error('Erreur récupération cotisations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une cotisation comme payée
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'cash' } = req.body;

    const cotisation = await Cotisation.findByIdAndUpdate(
      id,
      {
        statut: 'paye',
        paymentMethod,
        paidAt: new Date()
      },
      { new: true }
    ).populate('membre', 'firstName lastName role instrument');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    console.error('Erreur paiement cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Annuler un paiement
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const cotisation = await Cotisation.findByIdAndUpdate(
      id,
      {
        statut: 'non_paye',
        paymentMethod: null,
        paidAt: null
      },
      { new: true }
    ).populate('membre', 'firstName lastName role instrument');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    console.error('Erreur annulation cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Stats d'un mois
router.get('/stats/:mois', auth, async (req, res) => {
  try {
    const { mois } = req.params;
    const year = mois.split('-')[0];

    const cotisationsMois = await Cotisation.find({ mois })
      .populate('membre', 'status');

    const activeOnly = cotisationsMois.filter(c => 
      c.membre && ['actif', 'Actif'].includes(c.membre.status)
    );
    const paidThisMonth = activeOnly.filter(c => c.statut === 'paye');

    // Stats de l'année
    const cotisationsAnnee = await Cotisation.find({
      mois: { $regex: `^${year}` }
    }).populate('membre', 'status');

    const paidThisYear = cotisationsAnnee.filter(c => 
      c.statut === 'paye' && c.membre && ['actif', 'Actif'].includes(c.membre.status)
    );

    const totalCollected = paidThisYear.reduce((sum, c) => sum + c.montant, 0);

    const activeMembers = await Member.countDocuments({ 
      status: { $in: ['actif', 'Actif'] } 
    });
    
    const currentMonth = new Date().getMonth() + 1;
    const monthsElapsed = mois.startsWith(String(new Date().getFullYear()))
      ? currentMonth
      : 12;
    const totalExpected = activeMembers * monthsElapsed * 3000;

    res.json({
      month: {
        total: activeOnly.length,
        paid: paidThisMonth.length,
        unpaid: activeOnly.length - paidThisMonth.length,
        collected: paidThisMonth.reduce((sum, c) => sum + c.montant, 0)
      },
      totalCollected,
      totalExpected,
      percentage: totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0
    });
  } catch (error) {
    console.error('Erreur stats cotisations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Historique d'un membre
router.get('/member/:memberId', auth, async (req, res) => {
  try {
    const { memberId } = req.params;

    const cotisations = await Cotisation.find({ membre: memberId })
      .sort({ mois: -1 });

    res.json(cotisations);
  } catch (error) {
    console.error('Erreur historique membre:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
