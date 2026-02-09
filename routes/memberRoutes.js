import express from 'express';
import { 
  createMember, 
  getAllMembers, 
  getMember, 
  updateMember, 
  deleteMember,
  uploadPhoto 
} from '../controllers/memberController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllMembers)
  .post(createMember);

router.route('/:id')
  .get(getMember)
  .put(updateMember)
  .delete(deleteMember);

router.post('/:id/photo', upload.single('photo'), uploadPhoto);

export default router;
