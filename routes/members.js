import express from 'express';
import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  toggleMemberStatus
} from '../controllers/memberController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Toutes les routes nécessitent l'auth

router.route('/')
  .get(getMembers)
  .post(createMember);

router.route('/:id')
  .get(getMember)
  .put(updateMember);

router.patch('/:id/toggle-status', toggleMemberStatus);

export default router;
