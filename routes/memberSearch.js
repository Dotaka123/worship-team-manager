import express from 'express';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';
import { protect } from '../middleware/auth.js';
import { validate, searchSchemas } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// ============================================
// 🔍 RECHERCHE AVANCÉE DE MEMBRES
// ============================================
router.get('/search', validate(searchSchemas.members, 'query'), async (req, res) => {
  try {
    const {
      q,           // Texte de recherche
      role,        // Filtrer par rôle
      status,      // Filtrer par statut
      minAge,      // Âge minimum
      maxAge,      // Âge maximum
      instrument,  // Filtrer par instrument
      gender,      // Filtrer par genre
      sort = 'lastName', // Tri
      order = 'asc',     // Ordre de tri
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    // Recherche textuelle (nom, prénom, pseudo, email)
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { pseudo: searchRegex },
        { email: searchRegex },
        { residence: searchRegex }
      ];
    }

    // Filtres
    if (role) query.role = role;
    if (status) query.status = status;
    if (gender) query.gender = gender;
    if (instrument) query.instrument = new RegExp(instrument, 'i');
    
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }

    // Tri
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Exécuter la requête
    const [members, total] = await Promise.all([
      Member.find(query)
        .select('firstName lastName pseudo photo role status age instrument gender email phone residence dateEntree')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Member.countDocuments(query)
    ]);

    res.json({
      members,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        q, role, status, minAge, maxAge, instrument, gender
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 🔍 RECHERCHE DE MEMBRES AVEC STATS
// ============================================
router.get('/search-with-stats', async (req, res) => {
  try {
    const { q, status = 'actif', includeStats = 'true' } = req.query;

    let query = { status };

    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { pseudo: searchRegex }
      ];
    }

    const members = await Member.find(query)
      .select('firstName lastName pseudo photo role status')
      .limit(50);

    if (includeStats === 'false') {
      return res.json({ members });
    }

    // Enrichir avec les stats
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const [cotisationStats, attendanceStats] = await Promise.all([
          // Stats cotisations (6 derniers mois)
          Cotisation.aggregate([
            {
              $match: { membre: member._id }
            },
            {
              $sort: { mois: -1 }
            },
            {
              $limit: 6
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                paye: {
                  $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, 1, 0] }
                }
              }
            }
          ]),
          // Stats présences (3 derniers mois)
          Attendance.aggregate([
            {
              $match: {
                member: member._id,
                date: {
                  $gte: new Date(new Date().setMonth(new Date().getMonth() - 3))
                }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                present: {
                  $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                },
                retard: {
                  $sum: { $cond: [{ $eq: ['$status', 'en_retard'] }, 1, 0] }
                }
              }
            }
          ])
        ]);

        const cotisStats = cotisationStats[0] || { total: 0, paye: 0 };
        const attendStats = attendanceStats[0] || { total: 0, present: 0, retard: 0 };

        return {
          ...member.toObject(),
          stats: {
            cotisations: {
              total: cotisStats.total,
              paye: cotisStats.paye,
              tauxPaiement: cotisStats.total > 0 
                ? Math.round((cotisStats.paye / cotisStats.total) * 100) 
                : 0
            },
            attendance: {
              total: attendStats.total,
              present: attendStats.present + attendStats.retard,
              tauxPresence: attendStats.total > 0
                ? Math.round(((attendStats.present + attendStats.retard) / attendStats.total) * 100)
                : 0
            }
          }
        };
      })
    );

    res.json({ members: membersWithStats });
  } catch (error) {
    console.error('Search with stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 🔍 AUTOCOMPLETE - Recherche rapide
// ============================================
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i');
    
    const members = await Member.find({
      status: { $in: ['actif', 'en_pause'] },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { pseudo: searchRegex }
      ]
    })
    .select('firstName lastName pseudo photo role')
    .limit(parseInt(limit));

    const formatted = members.map(m => ({
      id: m._id,
      label: `${m.firstName} ${m.lastName} (${m.pseudo})`,
      pseudo: m.pseudo,
      photo: m.photo,
      role: m.role
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📊 FILTRES DISPONIBLES - Pour UI dynamique
// ============================================
router.get('/filters', async (req, res) => {
  try {
    const [roles, instruments, statuses] = await Promise.all([
      Member.distinct('role'),
      Member.distinct('instrument').then(instruments => 
        instruments.filter(i => i && i.trim())
      ),
      Member.distinct('status')
    ]);

    const ageRanges = [
      { label: 'Moins de 18 ans', min: 0, max: 17 },
      { label: '18-24 ans', min: 18, max: 24 },
      { label: '25-34 ans', min: 25, max: 34 },
      { label: '35-44 ans', min: 35, max: 44 },
      { label: '45-54 ans', min: 45, max: 54 },
      { label: '55+ ans', min: 55, max: 100 }
    ];

    res.json({
      roles,
      instruments,
      statuses,
      ageRanges,
      genders: ['homme', 'femme']
    });
  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
