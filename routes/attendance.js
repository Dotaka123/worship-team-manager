import express from 'express';
import { 
  recordAttendance, 
  getAttendanceByDate,
  getAttendanceByMember,
  updateAttendance,
  deleteAttendance,
  deleteAttendanceByMemberAndDate,
  getAllAttendance
} from '../controllers/attendanceController.js';
import { protect, canModify } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de lecture - accessibles à tous
router.get('/all', getAllAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/member/:memberId', getAttendanceByMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, recordAttendance);
router.put('/:id', canModify, updateAttendance);
router.delete('/:id', canModify, deleteAttendance);
// ✅ NOUVELLE ROUTE: Supprimer par memberId et date
router.delete('/', canModify, deleteAttendanceByMemberAndDate);

export default router;
