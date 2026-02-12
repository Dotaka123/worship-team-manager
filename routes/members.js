import express from 'express';
import { 
  createMember, 
  getAllMembers, 
  getMember, 
  updateMember, 
  deleteMember,
  uploadPhoto 
} from '../controllers/memberController.js';
import { protect, canModify } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de lecture - accessibles à tous les utilisateurs authentifiés (y compris viewer)
router.get('/', getAllMembers);
router.get('/:id', getMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, createMember);
router.put('/:id', canModify, updateMember);
router.delete('/:id', canModify, deleteMember);
router.post('/:id/photo', canModify, upload.single('photo'), uploadPhoto);

export default router;
