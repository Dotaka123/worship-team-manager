import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateCotisations,
  getCotisationsByMonth,
  markAsPaid,
  updateCotisation,
  getCotisationStats
} from '../controllers/cotisationController.js';

const router = express.Router();

router.use(protect); // Protection sur toutes les routes

router.post('/generate', generateCotisations);
router.get('/month/:mois', getCotisationsByMonth);
router.get('/stats/:mois', getCotisationStats);
router.patch('/:id/pay', markAsPaid);
router.patch('/:id', updateCotisation);

export default router;
