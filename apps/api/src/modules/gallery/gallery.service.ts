import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { AppError } from '../../utils/appError';
import {
  GALLERY_DELIVERY_FORMAT,
  GALLERY_FOLDER,
  GALLERY_PAGE_SIZE,
  GALLERY_MAX_PAGE_SIZE,
} from '../../constants';
import {
  buildTransformation,
  checkDimensions,
  cleanName,
  detectImageFormat,
  isFormatAllowed,
  normalizePublicId,
  GalleryPurpose,
  PURPOSE_LABELS,
} from './gallery.utils';

// ============================================================
// Galería: las imágenes viven en Cloudinary (no en Mongo), así que no hay
// colección que migrar. La API solo lista, sube, renombra y borra.
//
// El archivo original se guarda UNA vez y la optimización (webp + proporción
// 6:5 para productos) se pide por URL: Cloudinary genera el derivado la primera
// vez y lo sirve cacheado desde su CDN. Así no se paga dos veces por lo mismo.
// ============================================================

export interface GalleryImage {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}

export interface GalleryPage {
  images: GalleryImage[];
  nextCursor: string | null;
  /** Total de imágenes en la galería (aproximado, lo informa Cloudinary). */
  totalCount?: number;
}

interface CloudinaryResource {
  public_id: string;
  created_at: string;
  bytes: number;
  format?: string;
  width?: number;
  height?: number;
}

let configured = false;

const ensureConfig = (): void => {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError('Configuración de Cloudinary incompleta', 500);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  configured = true;
};

const friendlyName = (publicId: string): string => publicId.split('/').pop() || publicId;

const isDuplicateError = (error: unknown): boolean => {
  const err = error as { http_code?: number; message?: string };
  return err?.http_code === 409 || /already exists/i.test(String(err?.message || ''));
};

/** URL de entrega optimizada (Cloudinary la genera y cachea en su CDN). */
const deliveryUrl = (publicId: string, purpose: GalleryPurpose, animated: boolean): string =>
  cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: buildTransformation(purpose, animated),
    ...(animated ? {} : { format: GALLERY_DELIVERY_FORMAT }),
  });

const toGalleryImage = (resource: CloudinaryResource, purpose: GalleryPurpose = 'product'): GalleryImage => {
  const animated = resource.format === 'gif';

  return {
    id: resource.public_id,
    name: friendlyName(resource.public_id),
    url: deliveryUrl(resource.public_id, purpose, animated),
    createdAt: resource.created_at,
    bytes: resource.bytes,
    format: animated ? 'gif' : GALLERY_DELIVERY_FORMAT,
    width: resource.width,
    height: resource.height,
  };
};

const runUpload = (file: Express.Multer.File, publicId: string): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: GALLERY_FOLDER,
        public_id: publicId,
        unique_filename: false,
        overwrite: false,
        resource_type: 'image',
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new AppError('No se pudo subir la imagen', 500));
        } else {
          resolve(uploadResult);
        }
      }
    );
    stream.end(file.buffer);
  });

export const GalleryService = {
  validateUpload(file: Express.Multer.File, purpose: GalleryPurpose): void {
    const format = detectImageFormat(file.buffer);

    if (!isFormatAllowed(format, purpose)) {
      throw new AppError(
        `Formato no permitido. Se aceptan ${PURPOSE_LABELS[purpose]}.`,
        400
      );
    }
  },

  uploadImage: async (
    file: Express.Multer.File,
    title?: string,
    purpose: GalleryPurpose = 'product'
  ): Promise<GalleryImage> => {
    ensureConfig();
    GalleryService.validateUpload(file, purpose);

    const format = detectImageFormat(file.buffer);
    const animated = format === 'gif';
    const base = cleanName(title || file.originalname);

    let result: UploadApiResponse;
    try {
      result = await runUpload(file, base);
    } catch (error) {
      if (!isDuplicateError(error)) {
        throw new AppError('No se pudo subir la imagen', 500);
      }
      result = await runUpload(file, `${base}_${Date.now().toString(36)}`);
    }

    const dimensions = checkDimensions(result.width, result.height);
    if (!dimensions.ok) {
      // No se deja guardada una imagen que no cumple: se borra y se informa.
      await cloudinary.uploader.destroy(result.public_id).catch(() => undefined);
      throw new AppError(dimensions.message, 400);
    }

    return {
      id: result.public_id,
      name: friendlyName(result.public_id),
      url: deliveryUrl(result.public_id, purpose, animated),
      createdAt: result.created_at,
      bytes: result.bytes,
      format: animated ? 'gif' : GALLERY_DELIVERY_FORMAT,
      width: result.width,
      height: result.height,
    };
  },

  /** Página de a favor del cursor: el navegador solo recibe lo que va a mostrar. */
  getGalleryImages: async (
    options: { limit?: number; cursor?: string; purpose?: GalleryPurpose } = {}
  ): Promise<GalleryPage> => {
    ensureConfig();

    const limit = Math.min(Math.max(options.limit || GALLERY_PAGE_SIZE, 1), GALLERY_MAX_PAGE_SIZE);
    const purpose = options.purpose || 'product';

    let query = cloudinary.search
      .expression(`resource_type:image AND folder:${GALLERY_FOLDER}`)
      .sort_by('created_at', 'desc')
      .max_results(limit);

    if (options.cursor) query = query.next_cursor(options.cursor);

    const result = (await query.execute()) as {
      resources?: CloudinaryResource[];
      next_cursor?: string;
      total_count?: number;
    };

    return {
      images: (result.resources || []).map((resource) => toGalleryImage(resource, purpose)),
      nextCursor: result.next_cursor || null,
      totalCount: result.total_count,
    };
  },

  /** Cambia solo el nombre (public_id) de la imagen: no se vuelve a subir nada. */
  renameImage: async (imageId: string, newName: string): Promise<GalleryImage> => {
    ensureConfig();

    const fromId = normalizePublicId(imageId);
    if (!fromId) throw new AppError('Id de imagen inválido', 400);

    const base = cleanName(newName);
    // La imagen se queda donde está: si hoy no tiene carpeta, no se le agrega.
    const folder = fromId.includes('/') ? `${fromId.slice(0, fromId.lastIndexOf('/'))}/` : '';
    let toId = `${folder}${base}`;

    if (toId !== fromId) {
      try {
        await cloudinary.uploader.rename(fromId, toId, { overwrite: false, invalidate: true });
      } catch (error) {
        if (!isDuplicateError(error)) {
          throw new AppError('No se pudo renombrar la imagen', 500);
        }
        toId = `${folder}${base}_${Date.now().toString(36)}`;
        await cloudinary.uploader.rename(fromId, toId, { overwrite: false, invalidate: true });
      }
    }

    const resource = (await cloudinary.api.resource(toId)) as unknown as CloudinaryResource;
    return toGalleryImage(resource);
  },

  deleteImage: async (imageId: string): Promise<void> => {
    ensureConfig();

    const safeId = normalizePublicId(imageId);
    if (!safeId) {
      throw new AppError('Id de imagen inválido', 400);
    }

    const result = await cloudinary.uploader.destroy(safeId);

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new AppError('No se pudo eliminar la imagen', 500);
    }
  },
};
