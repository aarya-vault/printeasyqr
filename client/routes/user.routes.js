import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// User update route (any authenticated user can update their own profile)
router.patch('/users/:id', requireAuth, UserController.updateUser);
router.get('/users/:id', requireAuth, UserController.getUserById);

export default router;