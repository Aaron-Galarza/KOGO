import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { GalleryService } from './gallery.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/appError';
import { GALLERY_MAX_UPLOAD_MB, GALLERY_PAGE_SIZE, GALLERY_MAX_PAGE_SIZE } from '../../constants';
import { GalleryPurpose, GALLERY_PURPOSES } from './gallery.utils';

// El filtro de multer es solo una primera barrera (mimetype/extensión): la
// validación real se hace sobre los bytes del archivo y según el propósito.
const ALLOWED_EXT = /\.(gif|jpe?g|png|webp)$/i;

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: GALLERY_MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || ALLOWED_EXT.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new AppError('Solo se permiten imágenes (JPG, PNG, WEBP o GIF)', 400));
    }
  },
}).single('image');

const upload = (req: Request, res: Response, next: NextFunction) => {
  uploadMiddleware(req, res, (err: any) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(`La imagen supera el tamaño máximo de ${GALLERY_MAX_UPLOAD_MB} MB`, 400)
      );
    }
    return next(new AppError('Error al subir el archivo', 400));
  });
};

/** Express 5 entrega los comodines como array: se rearma el id completo. */
const readWildcardParam = (raw: unknown): string =>
  (Array.isArray(raw) ? raw.join('/') : (raw as string) || '').trim();

const readPurpose = (value: unknown): GalleryPurpose =>
  GALLERY_PURPOSES.includes(value as GalleryPurpose) ? (value as GalleryPurpose) : 'product';

export const GalleryController = {
  upload,

  uploadImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return sendError(res, 'No se envió ninguna imagen', 400);
    }

    const purpose = readPurpose(req.body?.purpose);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : undefined;

    const image = await GalleryService.uploadImage(req.file, title || undefined, purpose);
    sendSuccess(res, image, 201, 'Imagen subida correctamente');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, GALLERY_MAX_PAGE_SIZE)
      : GALLERY_PAGE_SIZE;

    const cursor = typeof req.query.cursor === 'string' && req.query.cursor ? req.query.cursor : undefined;
    const purpose = readPurpose(req.query.purpose);

    const page = await GalleryService.getGalleryImages({ limit, cursor, purpose });
    sendSuccess(res, page, 200);
  }),

  rename: asyncHandler(async (req: Request, res: Response) => {
    const imageId = readWildcardParam(req.params.imageId);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

    if (!imageId) return sendError(res, 'Id de imagen inválido', 400);
    if (!name) return sendError(res, 'Ingresá un nombre para la imagen', 400);
    if (name.length > 80) return sendError(res, 'El nombre no puede superar los 80 caracteres', 400);

    const image = await GalleryService.renameImage(imageId, name);
    sendSuccess(res, image, 200, 'Imagen actualizada');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const imageId = readWildcardParam(req.params.imageId);
    await GalleryService.deleteImage(imageId);
    sendSuccess(res, { imageId }, 200, 'Imagen eliminada');
  }),
};
