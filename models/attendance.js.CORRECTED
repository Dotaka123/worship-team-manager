import express from 'express';
import { 
  recordAttendance, 
  getAttendanceByDate,
  getAttendanceByMember,
  updateAttendance,
  deleteAttendance,
  getAllAttendance  // ✅ NOUVEAU: Import de la nouvelle fonction
} from '../controllers/attendanceController.js';
import { protect, canModify } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// ✅ NOUVEAU: Route pour récupérer toutes les présences
router.get('/all', getAllAttendance);

// Routes de lecture - accessibles à tous
router.get('/date/:date', getAttendanceByDate);
router.get('/member/:memberId', getAttendanceByMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, recordAttendance);
router.put('/:id', canModify, updateAttendance);
router.delete('/:id', canModify, deleteAttendance);

export default router;
