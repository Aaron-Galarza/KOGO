import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { checkoutLimiter } from '../../middlewares/rateLimit.middleware';
import { CreateCheckoutSchema } from './payments.schema';

const router = Router();

// Público: iniciar el pago online de un pedido existente (valida contra el pedido guardado).
router.post(
  '/checkout',
  checkoutLimiter,
  validateRequest(CreateCheckoutSchema),
  PaymentsController.createCheckout
);

// Público: estado de pago de un pedido para la página de retorno.
router.get('/orders/:orderId/status', PaymentsController.getStatus);

// Público: notificaciones de Mercado Pago (validación por firma).
router.post('/webhook', PaymentsController.webhook);

export default router;
