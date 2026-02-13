import express from 'express';
import { 
  createCotisation,
  getAllCotisations,
  getCotisation,
  updateCotisation,
  deleteCotisation,
  getCotisationsByMember,
  getRecentPayments,
  getMembershipStats
} from '../controllers/cotisationController.js';
import { protect, canModify } from '../middleware/auth.js';
import Cotisation from '../models/Cotisation.js';
import Member from '../models/Member.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Route pour obtenir les cotisations par mois
router.get('/month/:mois', async (req, res) => {
  try {
    const { mois } = req.params;
    
    const cotisations = await Cotisation.find({ mois })
      .populate('membre', 'firstName lastName pseudo email role photo')
      .sort({ createdAt: -1 });

    res.json(cotisations);
  } catch (error) {
    console.error('❌ getCotisationsByMonth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les statistiques par mois
router.get('/stats/:mois', async (req, res) => {
  try {
    const { mois } = req.params;

    const stats = await Cotisation.aggregate([
      { $match: { mois } },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          montantTotal: { $sum: '$montant' }
        }
      }
    ]);

    const total = await Cotisation.countDocuments({ mois });
    const totalMontant = await Cotisation.aggregate([
      { $match: { mois } },
      {
        $group: {
          _id: null,
          total: { $sum: '$montant' }
        }
      }
    ]);

    res.json({ 
      stats, 
      total,
      totalMontant: totalMontant[0]?.total || 0
    });
  } catch (error) {
    console.error('❌ getStatsByMonth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir l'historique des cotisations d'un membre
router.get('/member/:memberId/history', async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const cotisations = await Cotisation.find({ membre: memberId })
      .populate('membre', 'firstName lastName pseudo email role photo')
      .sort({ mois: -1 });

    res.json(cotisations);
  } catch (error) {
    console.error('❌ getMemberHistory error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour générer les cotisations pour un mois
router.post('/generate', canModify, async (req, res) => {
  try {
    const { mois } = req.body;
    
    if (!mois) {
      return res.status(400).json({ message: 'Le mois est requis' });
    }

    // Récupérer tous les membres actifs
    const members = await Member.find({ status: 'active' });
    
    if (members.length === 0) {
      return res.status(400).json({ message: 'Aucun membre actif trouvé' });
    }

    // Vérifier si des cotisations existent déjà pour ce mois
    const existingCount = await Cotisation.countDocuments({ mois });
    
    if (existingCount > 0) {
      return res.status(400).json({ 
        message: `${existingCount} cotisation(s) existent déjà pour ${mois}` 
      });
    }

    // Créer les cotisations
    const cotisations = [];
    for (const member of members) {
      const cotisation = await Cotisation.create({
        membre: member._id,
        mois,
        montant: 3000,
        statut: 'non_paye',
        createdBy: req.user._id
      });
      cotisations.push(cotisation);
    }

    // Populate et retourner
    const populated = await Cotisation.find({ mois })
      .populate('membre', 'firstName lastName pseudo email role photo');

    res.status(201).json({
      message: `${cotisations.length} cotisations générées pour ${mois}`,
      cotisations: populated
    });

  } catch (error) {
    console.error('❌ generateCotisations error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Routes de lecture - accessibles à tous
router.get('/', getAllCotisations);
router.get('/stats', getMembershipStats);
router.get('/recent', getRecentPayments);
router.get('/:id', getCotisation);
router.get('/member/:memberId', getCotisationsByMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, createCotisation);
router.put('/:id', canModify, updateCotisation);

// Route pour marquer comme payé
router.patch('/:id/pay', canModify, async (req, res) => {
  try {
    const { methodePaiement, datePaiement } = req.body;

    const cotisation = await Cotisation.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'paye',
        methodePaiement,
        datePaiement: datePaiement || new Date()
      },
      { new: true, runValidators: true }
    ).populate('membre', 'firstName lastName pseudo email role photo');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    console.error('❌ markAsPaid error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Route pour annuler un paiement
router.patch('/:id/cancel', canModify, async (req, res) => {
  try {
    const cotisation = await Cotisation.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'non_paye',
        methodePaiement: null,
        datePaiement: null
      },
      { new: true, runValidators: true }
    ).populate('membre', 'firstName lastName pseudo email role photo');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    console.error('❌ cancelPayment error:', error);
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', canModify, updateCotisation);
router.delete('/:id', canModify, deleteCotisation);

export default router;
