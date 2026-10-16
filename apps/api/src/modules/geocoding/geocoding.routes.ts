import { Router } from 'express';
import { GeocodingController } from './geocoding.controller';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { geocodeLimiter } from '../../middlewares/rateLimit.middleware';

const router = Router();

// Público: buscar direcciones (proxy del backend hacia Google; la key no viaja al cliente).
router.get('/search', geocodeLimiter, GeocodingController.search);

// Admin: consumo del mes y tamaño de la caché (para cuidar la capa gratuita).
router.get('/usage', protect, isAdmin, GeocodingController.usage);

export default router;
