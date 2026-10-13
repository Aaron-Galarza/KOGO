import { Router } from 'express';
import { protect, isAdmin } from '../../middlewares/auth.middleware';
import { GalleryController } from './gallery.controller';

const router = Router();

router.get('/', protect, GalleryController.list);
router.post('/', protect, isAdmin, GalleryController.upload, GalleryController.uploadImage);
router.delete('/:imageId', protect, isAdmin, GalleryController.remove);

export default router;
