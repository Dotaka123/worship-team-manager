import express from 'express';
import { 
  createNote, 
  getAllNotes, 
  getNote, 
  updateNote, 
  deleteNote 
} from '../controllers/noteController.js';
import { protect, canModify } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de lecture - accessibles à tous
router.get('/', getAllNotes);
router.get('/:id', getNote);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, createNote);
router.put('/:id', canModify, updateNote);
router.delete('/:id', canModify, deleteNote);

export default router;
