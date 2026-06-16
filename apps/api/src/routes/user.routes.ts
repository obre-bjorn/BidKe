// apps/api/src/routes/user.routes.ts
import { Router } from 'express';
import { getDashboardData } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js'; // Your auth guard

const router = Router();

// 🔒 Protected Route
router.get('/dashboard', authMiddleware, getDashboardData);

export default router;