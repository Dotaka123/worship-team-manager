import express from 'express';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// GET tous les membres
router.get('/', protect, async (req, res) => {
  try {
    const members = await Member.find().sort({ firstName: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET un membre avec ses stats
router.get('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Récupérer toutes les cotisations du membre
    const cotisations = await Cotisation.find({ membre: member._id }).sort({ mois: -1 });
    
    const cotisationsPaye = cotisations.filter(c => c.statut === 'paye').length;
    const cotisationsNonPaye = cotisations.filter(c => c.statut !== 'paye').length;
    
    // Calculer jours avant anniversaire
    let joursAvantAnniversaire = null;
    if (member.dateOfBirth) {
      const today = new Date();
      const nextBirthday = new Date(
        today.getFullYear(),
        member.dateOfBirth.getMonth(),
        member.dateOfBirth.getDate()
      );
      
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const diffTime = nextBirthday - today;
      joursAvantAnniversaire = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Stats cotisations par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const cotisationsChart = cotisations
      .filter(c => new Date(c.mois) >= sixMonthsAgo)
      .map(c => ({
        mois: c.mois,
        statut: c.statut,
        montant: c.montant
      }));

    res.json({
      member,
      stats: {
        cotisationsPaye,
        cotisationsNonPaye,
        totalCotisations: cotisations.length,
        joursAvantAnniversaire,
        cotisationsChart
      },
      cotisations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST créer un membre
router.post('/', protect, async (req, res) => {
  try {
    const member = await Member.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT modifier un membre
router.put('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST upload photo
router.post('/:id/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { photo: req.file.path },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE supprimer un membre
router.delete('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }
    res.json({ message: 'Membre supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
