import { Router } from 'express';
import { DeliveryController } from './delivery.controller';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { noStore } from '../../middlewares/cache.middleware';
import { deliveryLimiter } from '../../middlewares/rateLimit.middleware';
import {
  AddKmRangeSchema,
  CalculateDeliverySchema,
  UpdateDeliveryConfigSchema,
  UpdateRainSchema,
} from './delivery.schema';

const router = Router();

// Público: vista previa del costo de envío (la usan el checkout y el POS).
router.post('/calculate', deliveryLimiter, validateRequest(CalculateDeliverySchema), DeliveryController.calculate);

// Público: datos mínimos de la tabla de envío (rangos y lluvia). Sin caché: si
// el negocio cambia precios o el recargo por lluvia, debe aplicar al instante.
router.get('/config/public', noStore, DeliveryController.publicConfig);

// Admin: configuración completa y edición.
router.get('/config', protect, isAdmin, DeliveryController.getConfig);
router.put('/config', protect, isAdmin, validateRequest(UpdateDeliveryConfigSchema), DeliveryController.updateConfig);
router.patch('/config/rain', protect, isAdmin, validateRequest(UpdateRainSchema), DeliveryController.updateRain);
router.post('/config/ranges', protect, isAdmin, validateRequest(AddKmRangeSchema), DeliveryController.addRange);
router.delete('/config/ranges/:id', protect, isAdmin, DeliveryController.deleteRange);

// Admin: consumo de la API de Google (control de gasto).
router.get('/usage', protect, isAdmin, DeliveryController.usage);

export default router;
