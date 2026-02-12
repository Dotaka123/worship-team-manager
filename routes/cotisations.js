import express from 'express';
import { 
  createCotisation,
  getAllCotisations,
  getCotisation,
  updateCotisation,
  deleteCotisation,
  getCotisationsByMember,
  getRecentPayments,
  getMembershipStats
} from '../controllers/cotisationController.js';
import { protect, canModify } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de lecture - accessibles à tous
router.get('/', getAllCotisations);
router.get('/stats', getMembershipStats);
router.get('/recent', getRecentPayments);
router.get('/:id', getCotisation);
router.get('/member/:memberId', getCotisationsByMember);

// Routes de modification - réservées aux admin et responsables
router.post('/', canModify, createCotisation);
router.put('/:id', canModify, updateCotisation);
router.delete('/:id', canModify, deleteCotisation);

export default router;
