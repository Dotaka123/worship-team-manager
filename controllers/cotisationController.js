import Cotisation from '../models/Cotisation.js';
import Member from '../models/Member.js';

// Créer une cotisation
export const createCotisation = async (req, res) => {
  try {
    const { membre, mois, montant, statut, methodePaiement, datePaiement, notes } = req.body;
    
    if (!membre || !mois) {
      return res.status(400).json({ 
        message: 'membre et mois sont requis' 
      });
    }

    const member = await Member.findById(membre);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Vérifier si la cotisation existe déjà pour ce membre ce mois-ci
    const existing = await Cotisation.findOne({ membre, mois });
    if (existing) {
      return res.status(400).json({ 
        message: 'Une cotisation existe déjà pour ce membre ce mois-ci' 
      });
    }

    const cotisation = await Cotisation.create({
      membre,
      mois,
      montant: montant || 3000,
      statut: statut || 'non_paye',
      methodePaiement,
      datePaiement,
      notes,
      createdBy: req.user._id
    });

    const populated = await Cotisation.findById(cotisation._id)
      .populate('membre', 'firstName lastName pseudo email role photo');

    res.status(201).json(populated);
  } catch (error) {
    console.error('❌ createCotisation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Obtenir toutes les cotisations
export const getAllCotisations = async (req, res) => {
  try {
    const { mois } = req.query;
    
    let query = {};
    if (mois) {
      query.mois = mois;
    }

    const cotisations = await Cotisation.find(query)
      .populate('membre', 'firstName lastName pseudo email role photo')
      .sort({ mois: -1, createdAt: -1 });

    res.json(cotisations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une cotisation spécifique
export const getCotisation = async (req, res) => {
  try {
    const cotisation = await Cotisation.findById(req.params.id)
      .populate('membre', 'firstName lastName pseudo email role phone photo');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une cotisation
export const updateCotisation = async (req, res) => {
  try {
    const { statut, montant, methodePaiement, datePaiement, notes } = req.body;

    const updateData = {};
    if (statut) updateData.statut = statut;
    if (montant) updateData.montant = montant;
    if (methodePaiement) updateData.methodePaiement = methodePaiement;
    if (datePaiement) updateData.datePaiement = datePaiement;
    if (notes !== undefined) updateData.notes = notes;

    const cotisation = await Cotisation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('membre', 'firstName lastName pseudo email role photo');

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une cotisation
export const deleteCotisation = async (req, res) => {
  try {
    const cotisation = await Cotisation.findByIdAndDelete(req.params.id);

    if (!cotisation) {
      return res.status(404).json({ message: 'Cotisation non trouvée' });
    }

    res.json({ message: 'Cotisation supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les cotisations d'un membre
export const getCotisationsByMember = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les paiements récents
export const getRecentPayments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const payments = await Cotisation.find({ statut: 'paye' })
      .populate('membre', 'firstName lastName pseudo email photo')
      .sort({ datePaiement: -1 })
      .limit(limit);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les statistiques des cotisations
export const getMembershipStats = async (req, res) => {
  try {
    const { mois } = req.query;

    let matchQuery = {};
    if (mois) {
      matchQuery.mois = mois;
    }

    const stats = await Cotisation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          montantTotal: { $sum: '$montant' }
        }
      }
    ]);

    const total = await Cotisation.countDocuments(matchQuery);
    const totalMontant = await Cotisation.aggregate([
      { $match: matchQuery },
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
    res.status(500).json({ message: error.message });
  }
};
