import express from 'express';
import {
  getAttendanceByDate,
  getMemberAttendance,
  markAttendance,
  getAllAttendance // NOUVELLE FONCTION
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/attendance/all - Obtenir TOUTES les présences
router.get('/all', getAllAttendance);

// GET /api/attendance?date=2024-01-15
router.get('/', getAttendanceByDate);

// GET /api/attendance/member/:memberId
router.get('/member/:memberId', getMemberAttendance);

// POST /api/attendance
router.post('/', markAttendance);

export default router;
