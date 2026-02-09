import Cotisation from '../models/Cotisation.js';
import Member from '../models/Member.js';

// Générer les cotisations pour un mois donné
export const generateCotisations = async (req, res) => {
  try {
    const { mois } = req.body; // Format: "2026-02"
    
    if (!mois || !/^\d{4}-\d{2}$/.test(mois)) {
      return res.status(400).json({ 
        message: 'Format de mois invalide. Utilise YYYY-MM' 
      });
    }

    // Récupérer tous les membres actifs
    const activeMembers = await Member.find({ 
      createdBy: req.user._id,
      status: 'actif' 
    });

    if (activeMembers.length === 0) {
      return res.status(400).json({ 
        message: 'Aucun membre actif trouvé' 
      });
    }

    const cotisations = [];
    
    for (const member of activeMembers) {
      // Vérifier si la cotisation existe déjà
      const existing = await Cotisation.findOne({
        member: member._id,
        mois,
        createdBy: req.user._id
      });

      if (!existing) {
        const cotisation = new Cotisation({
          member: member._id,
          mois,
          montant: 3000,
          statut: 'en_attente',
          createdBy: req.user._id
        });
        
        await cotisation.save();
        cotisations.push(cotisation);
      }
    }

    res.json({ 
      message: `${cotisations.length} cotisations générées pour ${mois}`,
      cotisations 
    });
  } catch (error) {
    console.error('❌ generateCotisations error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les cotisations par mois
export const getCotisationsByMonth = async (req, res) => {
  try {
    const { mois } = req.params;

    const cotisations = await Cotisation.find({
      mois,
      createdBy: req.user._id
    }).populate('member', 'firstName lastName email role');

    res.json(cotisations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marquer une cotisation comme payée
export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { methodePaiement, notes, datePaiement } = req.body;

    const cotisation = await Cotisation.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      {
        statut: 'payé',
        datePaiement: datePaiement || new Date(),
        methodePaiement,
        notes
      },
      { new: true }
    ).populate('member', 'firstName lastName email');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier une cotisation
export const updateCotisation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const cotisation = await Cotisation.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      updates,
      { new: true }
    ).populate('member', 'firstName lastName email');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Statistiques des cotisations
export const getCotisationStats = async (req, res) => {
  try {
    const { mois } = req.params;

    const stats = await Cotisation.aggregate([
      { 
        $match: { 
          mois, 
          createdBy: req.user._id 
        } 
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          montantTotal: { $sum: '$montant' }
        }
      }
    ]);

    const total = await Cotisation.countDocuments({ 
      mois, 
      createdBy: req.user._id 
    });

    res.json({ stats, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
