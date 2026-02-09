import express from 'express';
import {
  createMember,
  getAllMembers,
  getMember,
  updateMember,
  deleteMember
} from '../controllers/memberController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Routes protégées
router.post('/', protect, createMember);
router.get('/', protect, getAllMembers);
router.get('/:id', protect, getMember);
router.put('/:id', protect, updateMember);
router.delete('/:id', protect, deleteMember);

export default router;
