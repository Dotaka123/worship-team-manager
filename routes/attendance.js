import express from 'express';
import { 
  recordAttendance, 
  getAttendanceByDate,
  getAttendanceByMember,
  updateAttendance,
  deleteAttendance 
} from '../controllers/attendanceController.js';
import { protect, canModify } from '../middleware/auth.js';
import Attendance from '../models/Attendance.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Route pour obtenir toutes les présences (utilisée par le Dashboard)
router.get('/all', async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('member', 'firstName lastName pseudo email role instrument photo')
      .sort({ date: -1 })
      .limit(100);
    res.json(attendance);
  } catch (error) {
    console.error('❌ getAllAttendance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les présences par date avec query param
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date requise dans le query param' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('member', 'firstName lastName pseudo email role instrument photo');

    res.json(attendance);
  } catch (error) {
    console.error('❌ getAttendanceByDate error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Routes de lecture - accessibles à tous
router.get('/date/:date', getAttendanceByDate);
router.get('/member/:memberId', getAttendanceByMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, recordAttendance);
router.put('/:id', canModify, updateAttendance);
router.delete('/:id', canModify, deleteAttendance);

export default router;
