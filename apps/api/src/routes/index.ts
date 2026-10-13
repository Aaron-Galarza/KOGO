import { Router } from 'express';
import usersRoutes from '../modules/users/users.routes';
import productsRoutes from '../modules/products/products.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import additionalsRoutes from '../modules/additionals/additionals.routes';
import ordersRoutes from '../modules/orders/orders.routes';
import couponsRoutes from '../modules/coupons/coupons.routes';
import configRoutes from '../modules/config/config.routes';
import bannersRoutes from '../modules/banners/banners.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import galleryRoutes from '../modules/gallery/gallery.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/additionals', additionalsRoutes);
router.use('/orders', ordersRoutes);
router.use('/coupons', couponsRoutes);
router.use('/config', configRoutes);
router.use('/banners', bannersRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/gallery', galleryRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
