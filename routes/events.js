import express from 'express';
import { 
  createEvent, 
  getAllEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController.js';
import { protect, canModify } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de lecture - accessibles à tous
router.get('/', getAllEvents);
router.get('/:id', getEvent);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, createEvent);
router.put('/:id', canModify, updateEvent);
router.delete('/:id', canModify, deleteEvent);

export default router;
