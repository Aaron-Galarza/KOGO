import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { orderLimiter } from '../../middlewares/rateLimit.middleware';
import { CreateOrderSchema, UpdateOrderStatusSchema, UpdateDeliveryCostSchema } from './orders.schema';

const router = Router();

// Admin: listar órdenes
router.get('/admin', protect, isAdmin, OrdersController.getAll);

// Admin: estadísticas
router.get('/admin/stats', protect, isAdmin, OrdersController.getStats);

// Admin: obtener orden específica
router.get('/admin/:id', protect, isAdmin, OrdersController.getById);

// Admin: actualizar estado
router.patch(
  '/admin/:id/status',
  protect,
  isAdmin,
  validateRequest(UpdateOrderStatusSchema),
  OrdersController.updateStatus
);

// Admin: actualizar costo de envío
router.put(
  '/admin/:id/delivery-cost',
  protect,
  isAdmin,
  validateRequest(UpdateDeliveryCostSchema),
  OrdersController.updateDeliveryCost
);

// Admin: eliminar orden
router.delete('/admin/:id', protect, isAdmin, OrdersController.delete);

// Público: crear orden
router.post('/', orderLimiter, validateRequest(CreateOrderSchema), OrdersController.createOrder);

// Público: obtener orden
router.get('/:id', OrdersController.getOrder);

export default router;
