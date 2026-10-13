import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { protect, isOwner } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/admin', protect, isOwner, AnalyticsController.getStats);

export default router;
