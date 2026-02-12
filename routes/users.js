import express from 'express';
import { 
  getAllUsers,
  getUser,
  updateUserRole,
  deleteUser,
  promoteToAdmin,
  demoteFromAdmin
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification ET le rôle admin
router.use(protect);
router.use(adminOnly);

// Gestion des utilisateurs
router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

// Routes spéciales pour promouvoir/rétrograder par email
router.post('/promote', promoteToAdmin);
router.post('/demote', demoteFromAdmin);

export default router;
