import { Router } from 'express';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { GalleryController } from './gallery.controller';

const router = Router();

router.get('/', protect, GalleryController.list);

router.post('/', protect, isAdmin, GalleryController.upload, GalleryController.uploadImage);

// El public_id incluye la carpeta (KOGO/nombre), por eso se aceptan las dos
// variantes: con y sin comodín.
router.patch('/:imageId', protect, isAdmin, GalleryController.rename);
router.patch('/*imageId', protect, isAdmin, GalleryController.rename);

router.delete('/:imageId', protect, isAdmin, GalleryController.remove);
router.delete('/*imageId', protect, isAdmin, GalleryController.remove);

export default router;
