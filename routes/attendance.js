import express from 'express';
import {
  getAttendanceByDate,
  getMemberAttendance,
  markAttendance
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAttendanceByDate);
router.get('/member/:memberId', getMemberAttendance);
router.post('/', markAttendance);

export default router;
