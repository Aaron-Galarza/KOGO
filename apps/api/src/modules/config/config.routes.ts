import { Router } from 'express';
import { ConfigController } from './config.controller';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { cachePublic } from '../../middlewares/cache.middleware';
import { UpdateScheduleSchema, UpdateEmergencyMessageSchema, UpdateBannerSchema } from './config.schema';

const router = Router();

// Público (TTB bajo: 60s, el estado cambia con emergencias)
router.get('/status', cachePublic(60), ConfigController.getStatus);

// Admin
router.put('/schedule', protect, isAdmin, validateRequest(UpdateScheduleSchema), ConfigController.updateSchedule);
router.patch('/emergency', protect, isAdmin, ConfigController.toggleEmergency);
router.put('/emergency-message', protect, isAdmin, validateRequest(UpdateEmergencyMessageSchema), ConfigController.updateEmergencyMessage);
router.put('/banner', protect, isAdmin, validateRequest(UpdateBannerSchema), ConfigController.updateBanner);

export default router;
