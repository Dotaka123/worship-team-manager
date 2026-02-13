import express from 'express';
import Member from '../models/Member.js';
import Cotisation from '../models/Cotisation.js';
import Attendance from '../models/Attendance.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// ============================================
// 📊 GRAPHIQUE - ÉVOLUTION DES COTISATIONS
// ============================================
router.get('/charts/cotisations-trend', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const last12Months = [];
    const now = new Date();
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const stats = await Cotisation.aggregate([
        { $match: { mois } },
        {
          $group: {
            _id: '$statut',
            count: { $sum: 1 },
            montant: { $sum: '$montant' }
          }
        }
      ]);
      
      const paye = stats.find(s => s._id === 'paye') || { count: 0, montant: 0 };
      const nonPaye = stats.find(s => s._id === 'non_paye') || { count: 0, montant: 0 };
      const total = paye.count + nonPaye.count;
      
      last12Months.push({
        mois,
        paye: paye.count,
        nonPaye: nonPaye.count,
        montantPaye: paye.montant,
        montantTotal: paye.montant + nonPaye.montant,
        tauxPaiement: total > 0 ? Math.round((paye.count / total) * 100) : 0
      });
    }
    
    res.json(last12Months);
  } catch (error) {
    console.error('Charts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📊 GRAPHIQUE - ÉVOLUTION DES PRÉSENCES
// ============================================
router.get('/charts/attendance-trend', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const attendance = await Attendance.aggregate([
      { $match: { date: { $gte: daysAgo } } },
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
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formatted = attendance.map(a => ({
      date: a._id,
      present: a.present,
      absent: a.absent,
      retard: a.retard,
      total: a.total,
      tauxPresence: a.total > 0 ? Math.round(((a.present + a.retard) / a.total) * 100) : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Attendance charts error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 🏆 TOP PERFORMERS - MEILLEUR TAUX DE PRÉSENCE
// ============================================
router.get('/top-attendance', async (req, res) => {
  try {
    const { limit = 10, months = 3 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const topMembers = await Attendance.aggregate([
      { 
        $match: { 
          date: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: '$member',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          retard: {
            $sum: { $cond: [{ $eq: ['$status', 'en_retard'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxPresence: {
            $multiply: [
              { $divide: [{ $add: ['$present', '$retard'] }, '$total'] },
              100
            ]
          }
        }
      },
      { $match: { total: { $gte: 4 } } }, // Minimum 4 événements
      { $sort: { tauxPresence: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    // Populate member info
    await Member.populate(topMembers, {
      path: '_id',
      select: 'firstName lastName pseudo photo role status'
    });

    const formatted = topMembers.map(m => ({
      member: m._id,
      stats: {
        total: m.total,
        present: m.present,
        retard: m.retard,
        absent: m.absent,
        tauxPresence: Math.round(m.tauxPresence)
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Top attendance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📉 BOTTOM PERFORMERS - ALERTES ABSENCES
// ============================================
router.get('/low-attendance', async (req, res) => {
  try {
    const { limit = 10, months = 1, threshold = 50 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const lowMembers = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: '$member',
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          retard: {
            $sum: { $cond: [{ $eq: ['$status', 'en_retard'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxPresence: {
            $multiply: [
              { $divide: [{ $add: ['$present', '$retard'] }, '$total'] },
              100
            ]
          }
        }
      },
      { 
        $match: { 
          total: { $gte: 4 },
          tauxPresence: { $lt: parseInt(threshold) }
        } 
      },
      { $sort: { tauxPresence: 1 } },
      { $limit: parseInt(limit) }
    ]);
    
    await Member.populate(lowMembers, {
      path: '_id',
      select: 'firstName lastName pseudo photo email status'
    });

    const formatted = lowMembers.map(m => ({
      member: m._id,
      stats: {
        total: m.total,
        present: m.present,
        retard: m.retard,
        absent: m.absent,
        tauxPresence: Math.round(m.tauxPresence)
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Low attendance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📊 RÉPARTITION PAR RÔLE
// ============================================
router.get('/distribution/roles', async (req, res) => {
  try {
    const distribution = await Member.aggregate([
      { $match: { status: { $in: ['actif', 'en_pause'] } } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          actifs: {
            $sum: { $cond: [{ $eq: ['$status', 'actif'] }, 1, 0] }
          },
          en_pause: {
            $sum: { $cond: [{ $eq: ['$status', 'en_pause'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📊 RÉPARTITION PAR GENRE
// ============================================
router.get('/distribution/gender', async (req, res) => {
  try {
    const distribution = await Member.aggregate([
      { $match: { status: { $in: ['actif', 'en_pause'] } } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Gender distribution error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 📊 PYRAMIDE DES ÂGES
// ============================================
router.get('/distribution/age', async (req, res) => {
  try {
    const ageGroups = await Member.aggregate([
      { 
        $match: { 
          status: { $in: ['actif', 'en_pause'] },
          age: { $exists: true, $ne: null }
        } 
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 25, 35, 45, 55, 65, 100],
          default: 'Inconnu',
          output: {
            count: { $sum: 1 },
            members: { 
              $push: { 
                pseudo: '$pseudo',
                age: '$age' 
              } 
            }
          }
        }
      }
    ]);

    const formatted = ageGroups.map((group, index) => {
      const boundaries = [0, 18, 25, 35, 45, 55, 65, 100];
      const labels = ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
      
      return {
        range: group._id === 'Inconnu' ? 'Inconnu' : labels[index],
        count: group.count,
        percentage: 0 // À calculer côté frontend
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Age distribution error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 💰 INSIGHTS FINANCIERS
// ============================================
router.get('/financial-insights', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    // Moyenne mensuelle
    const avgMonthly = await Cotisation.aggregate([
      {
        $group: {
          _id: '$mois',
          total: { $sum: '$montant' },
          paye: {
            $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, '$montant', 0] }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTotal: { $avg: '$total' },
          avgPaye: { $avg: '$paye' }
        }
      }
    ]);

    // Meilleurs payeurs (toujours à jour)
    const bestPayers = await Cotisation.aggregate([
      { $match: { statut: 'paye' } },
      {
        $group: {
          _id: '$membre',
          totalPaye: { $sum: '$montant' },
          moisPayes: { $sum: 1 }
        }
      },
      { $sort: { moisPayes: -1, totalPaye: -1 } },
      { $limit: 10 }
    ]);

    await Member.populate(bestPayers, {
      path: '_id',
      select: 'firstName lastName pseudo photo'
    });

    // Tendance (derniers 6 mois)
    const trend = await Cotisation.aggregate([
      {
        $group: {
          _id: '$mois',
          montantPaye: {
            $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, '$montant', 0] }
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: parseInt(months) }
    ]);

    res.json({
      averages: avgMonthly[0] || { avgTotal: 0, avgPaye: 0 },
      bestPayers: bestPayers.map(p => ({
        member: p._id,
        totalPaye: p.totalPaye,
        moisPayes: p.moisPayes
      })),
      trend: trend.reverse()
    });
  } catch (error) {
    console.error('Financial insights error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 🎯 OBJECTIFS ET PRÉVISIONS
// ============================================
router.get('/goals', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Objectif du mois
    const activeMembers = await Member.countDocuments({ status: 'actif' });
    const targetAmount = activeMembers * 3000;
    
    // Progression actuelle
    const currentStats = await Cotisation.aggregate([
      { $match: { mois: currentMonth } },
      {
        $group: {
          _id: null,
          totalCollected: {
            $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, '$montant', 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$statut', 'paye'] }, 1, 0] }
          }
        }
      }
    ]);

    const collected = currentStats[0]?.totalCollected || 0;
    const paidCount = currentStats[0]?.paidCount || 0;
    const progress = targetAmount > 0 ? Math.round((collected / targetAmount) * 100) : 0;

    res.json({
      month: currentMonth,
      target: {
        amount: targetAmount,
        members: activeMembers
      },
      current: {
        collected,
        paidCount,
        unpaidCount: activeMembers - paidCount
      },
      progress: {
        percentage: progress,
        remaining: targetAmount - collected,
        remainingMembers: activeMembers - paidCount
      }
    });
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
