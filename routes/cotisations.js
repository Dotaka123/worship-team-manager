const express = require('express');
const router = express.Router();
const Cotisation = require('../models/Cotisation');
const Member = require('../models/Member');
const auth = require('../middleware/auth');

// Générer les cotisations pour un mois (pour tous les membres actifs)
router.post('/generate', auth, async (req, res) => {
  try {
    const { mois } = req.body; // Format: "2024-01"
    
    if (!mois) {
      return res.status(400).json({ message: 'Mois requis' });
    }

    // Récupérer tous les membres actifs
    const activeMembers = await Member.find({ status: 'actif' });
    
    const cotisations = [];
    
    for (const member of activeMembers) {
      // Vérifier si la cotisation existe déjà
      const existing = await Cotisation.findOne({ membre: member._id, mois });
      
      if (!existing) {
        const cotisation = await Cotisation.create({
          membre: member._id,
          mois,
          montant: 3000,
          statut: 'non_paye'
        });
        cotisations.push(cotisation);
      }
    }

    res.json({ 
      message: `${cotisations.length} cotisations générées`,
      created: cotisations.length 
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

    // Générer automatiquement si aucune cotisation n'existe pour ce mois
    const existing = await Cotisation.find({ mois });
    
    if (existing.length === 0) {
      const activeMembers = await Member.find({ status: 'actif' });
      
      for (const member of activeMembers) {
        await Cotisation.create({
          membre: member._id,
          mois,
          montant: 3000,
          statut: 'non_paye'
        });
      }
    }

    // Récupérer toutes les cotisations du mois avec les infos des membres
    const cotisations = await Cotisation.find({ mois })
      .populate('membre', 'firstName lastName role instrument status')
      .sort({ 'membre.firstName': 1 });

    // Filtrer seulement les membres actifs
    const filtered = cotisations.filter(c => c.membre && c.membre.status === 'actif');

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
        paidAt: new Date(),
        paidBy: req.user._id
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

// Annuler un paiement (remettre à non payé)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const cotisation = await Cotisation.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('membre', 'firstName lastName role instrument');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    console.error('Erreur mise à jour cotisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Stats d'un mois
router.get('/stats/:mois', auth, async (req, res) => {
  try {
    const { mois } = req.params;
    const year = mois.split('-')[0];

    // Stats du mois
    const cotisationsMois = await Cotisation.find({ mois })
      .populate('membre', 'status');
    
    const activeOnly = cotisationsMois.filter(c => c.membre?.status === 'actif');
    const paidThisMonth = activeOnly.filter(c => c.statut === 'paye');

    // Stats de l'année
    const cotisationsAnnee = await Cotisation.find({
      mois: { $regex: `^${year}` }
    }).populate('membre', 'status');

    const paidThisYear = cotisationsAnnee.filter(
      c => c.statut === 'paye' && c.membre?.status === 'actif'
    );

    const totalCollected = paidThisYear.reduce((sum, c) => sum + c.montant, 0);
    
    // Calcul du total attendu (membres actifs × 12 mois × montant)
    const activeMembers = await Member.countDocuments({ status: 'actif' });
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
      year: {
        totalCollected,
        totalExpected,
        percentage: totalExpected > 0 
          ? Math.round((totalCollected / totalExpected) * 100) 
          : 0
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

module.exports = router;
