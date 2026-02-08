import express from 'express';
import {
  getMemberNotes,
  createNote,
  deleteNote
} from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/member/:memberId', getMemberNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

export default router;
