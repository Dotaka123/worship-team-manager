import express from 'express';
import Cotisation from '../models/Cotisation.js';
import Member from '../models/Member.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/cotisations/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { mois } = req.body;

    if (!mois) {
      return res.status(400).json({ message: 'Mois requis' });
    }

    const activeMembers = await Member.find({
      status: { $in: ['actif', 'Actif'] }
    });

    let created = 0;

    for (const member of activeMembers) {
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

    res.json({ message: `${created} cotisations générées`, created });
  } catch (error) {
    console.error('Erreur génération:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/cotisations/month/:mois
router.get('/month/:mois', auth, async (req, res) => {
  try {
    const { mois } = req.params;

    const cotisations = await Cotisation.find({ mois })
      .populate('membre', 'firstName lastName role instrument status');

    const filtered = cotisations.filter(c => 
      c.membre && ['actif', 'Actif'].includes(c.membre.status)
    );

    res.json(filtered);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cotisations/:id/pay
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const cotisation = await Cotisation.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'paye',
        paymentMethod: req.body.paymentMethod || 'cash',
        paidAt: new Date()
      },
      { new: true }
    ).populate('membre', 'firstName lastName role');

    if (!cotisation) {
      return res.status(404).json({ message: 'Non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cotisations/:id/cancel
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const cotisation = await Cotisation.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'non_paye',
        paymentMethod: null,
        paidAt: null
      },
      { new: true }
    ).populate('membre', 'firstName lastName role');

    if (!cotisation) {
      return res.status(404).json({ message: 'Non trouvée' });
    }

    res.json(cotisation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/cotisations/stats/:mois
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

    // Total année
    const cotisationsAnnee = await Cotisation.find({
      mois: { $regex: `^${year}` },
      statut: 'paye'
    });

    const totalCollected = cotisationsAnnee.reduce((sum, c) => sum + c.montant, 0);

    res.json({
      month: {
        total: activeOnly.length,
        paid: paidThisMonth.length,
        unpaid: activeOnly.length - paidThisMonth.length,
        collected: paidThisMonth.reduce((sum, c) => sum + c.montant, 0)
      },
      totalCollected
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
