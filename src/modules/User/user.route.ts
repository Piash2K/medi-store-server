import express from 'express';
import { UserController } from './user.controller';
import { auth } from '../../middlewares/auth';

const router = express.Router();

// Protected routes
router.get('/profile', auth(), UserController.getUserProfile);
router.put('/profile', auth(), UserController.updateUserProfile);

export const UserRoutes = router;
