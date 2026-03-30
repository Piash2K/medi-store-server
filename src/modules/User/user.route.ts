import express from 'express';
import { UserController } from './user.controller';
import { auth } from '../../middlewares/auth';
import { upload } from '../../lib/cloudinary';

const router = express.Router();

// Protected routes
router.get('/profile', auth(), UserController.getUserProfile);
router.put('/profile', auth(), upload.single('profileImage'), UserController.updateUserProfile);
router.patch('/profile/photo', auth(), upload.single('profileImage'), UserController.updateProfilePhoto);

export const UserRoutes = router;
