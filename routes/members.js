import express from 'express';
import {
  getMembers,
  getMemberById,      // ✅ Nom correct
  createMember,
  updateMember,
  deleteMember
} from '../controllers/memberController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes CRUD
router.route('/')
  .get(getMembers)      // GET /api/members
  .post(createMember);  // POST /api/members

router.route('/:id')
  .get(getMemberById)   // GET /api/members/:id
  .put(updateMember)    // PUT /api/members/:id
  .delete(deleteMember); // DELETE /api/members/:id

export default router;
