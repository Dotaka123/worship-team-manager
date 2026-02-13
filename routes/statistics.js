import express from 'express';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// ============================================
// STATISTIQUES GLOBALES
// ============================================
router.get('/global', async (req, res) => {
  try {
    // Membres
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'actif' });
    const inactiveMembers = await Member.countDocuments({ status: 'inactif' });
    
    // Cotisations
    const totalCotisations = await Cotisation.countDocuments();
    const cotisationsPaye = await Cotisation.countDocuments({ statut: 'paye' });
    const cotisationsNonPaye = await Cotisation.countDocuments({ statut: 'non_paye' });
    
    // Montants
    const montantTotal = await Cotisation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$montant' }
        }
      }
    ]);
    
    const montantPaye = await Cotisation.aggregate([
      { $match: { statut: 'paye' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$montant' }
        }
      }
    ]);

    // Présences
    const totalPresences = await Attendance.countDocuments();
    const totalPresent = await Attendance.countDocuments({ status: 'present' });
    const totalAbsent = await Attendance.countDocuments({ status: 'absent' });
    const totalRetard = await Attendance.countDocuments({ status: 'en_retard' });

    // Aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const presentsToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present'
    });

    res.json({
      members: {
        total: totalMembers,
        actifs: activeMembers,
        inactifs: inactiveMembers
      },
      cotisations: {
        total: totalCotisations,
        paye: cotisationsPaye,
        nonPaye: cotisationsNonPaye,
        montantTotal: montantTotal[0]?.total || 0,
        montantPaye: montantPaye[0]?.total || 0
      },
      attendance: {
        total: totalPresences,
        present: totalPresent,
        absent: totalAbsent,
        retard: totalRetard,
        presentsToday
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// DASHBOARD - Toutes les données pour le dashboard
// ============================================
router.get('/dashboard', async (req, res) => {
  try {
    // Membres actifs
    const members = await Member.find({ status: 'actif' })
      .select('firstName lastName pseudo photo role')
      .limit(10);

    // Cotisations récentes
    const recentCotisations = await Cotisation.find()
      .populate('membre', 'firstName lastName pseudo photo')
      .sort({ createdAt: -1 })
      .limit(10);

    // Présences d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('member', 'firstName lastName pseudo photo')
      .sort({ createdAt: -1 });

    // Stats rapides
    const stats = {
      totalMembers: await Member.countDocuments({ status: 'actif' }),
      cotisationsPaye: await Cotisation.countDocuments({ statut: 'paye' }),
      cotisationsNonPaye: await Cotisation.countDocuments({ statut: 'non_paye' }),
      presentsToday: todayAttendance.filter(a => a.status === 'present').length
    };

    res.json({
      stats,
      members,
      recentCotisations,
      todayAttendance
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// STATS PAR MEMBRE
// ============================================
router.get('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    // Cotisations du membre
    const cotisations = await Cotisation.find({ membre: memberId });
    const cotisationsPaye = cotisations.filter(c => c.statut === 'paye').length;
    const montantTotal = cotisations.reduce((sum, c) => sum + c.montant, 0);
    const montantPaye = cotisations
      .filter(c => c.statut === 'paye')
      .reduce((sum, c) => sum + c.montant, 0);

    // Présences du membre
    const presences = await Attendance.find({ member: memberId });
    const totalPresent = presences.filter(p => p.status === 'present').length;
    const totalAbsent = presences.filter(p => p.status === 'absent').length;
    const totalRetard = presences.filter(p => p.status === 'en_retard').length;
    const tauxPresence = presences.length > 0
      ? Math.round(((totalPresent + totalRetard) / presences.length) * 100)
      : 0;

    res.json({
      member,
      cotisations: {
        total: cotisations.length,
        paye: cotisationsPaye,
        nonPaye: cotisations.length - cotisationsPaye,
        montantTotal,
        montantPaye
      },
      attendance: {
        total: presences.length,
        present: totalPresent,
        absent: totalAbsent,
        retard: totalRetard,
        tauxPresence
      }
    });
  } catch (error) {
    console.error('Member stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// STATS PAR MOIS
// ============================================
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let matchQuery = {};
    if (year && month) {
      matchQuery.mois = `${year}-${month.padStart(2, '0')}`;
    }

    // Cotisations du mois
    const cotisations = await Cotisation.find(matchQuery)
      .populate('membre', 'firstName lastName pseudo photo');
    
    const stats = {
      total: cotisations.length,
      paye: cotisations.filter(c => c.statut === 'paye').length,
      nonPaye: cotisations.filter(c => c.statut === 'non_paye').length,
      montantTotal: cotisations.reduce((sum, c) => sum + c.montant, 0),
      montantPaye: cotisations
        .filter(c => c.statut === 'paye')
        .reduce((sum, c) => sum + c.montant, 0)
    };

    res.json({
      stats,
      cotisations
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GRAPHIQUES - Données pour les charts
// ============================================
router.get('/charts/cotisations', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const cotisations = await Cotisation.aggregate([
      {
        $group: {
          _id: '$mois',
          total: { $sum: '$montant' },
          count: { $sum: 1 },
          paye: {
            $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 6 }
    ]);

    res.json(cotisations);
  } catch (error) {
    console.error('Charts error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/charts/attendance', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await Attendance.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          retard: {
            $sum: { $cond: [{ $eq: ['$status', 'en_retard'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(attendance);
  } catch (error) {
    console.error('Attendance charts error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
