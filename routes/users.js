import express from 'express';
import { 
  getAllUsers, 
  getUser, 
  updateUserRole, 
  toggleEditPermission,
  deleteUser,
  promoteToAdmin,
  demoteFromAdmin
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes réservées aux admins
router.get('/', adminOnly, getAllUsers);
router.get('/:id', adminOnly, getUser);
router.put('/:id/role', adminOnly, updateUserRole);
router.put('/toggle-edit', adminOnly, toggleEditPermission); // Nouvelle route
router.delete('/:id', adminOnly, deleteUser);
router.post('/promote', adminOnly, promoteToAdmin);
router.post('/demote', adminOnly, demoteFromAdmin);

export default router;
