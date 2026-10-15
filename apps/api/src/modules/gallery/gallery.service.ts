import {
  v2 as cloudinary,
  UploadApiResponse,
} from 'cloudinary';
import { AppError } from '../../utils/appError';

const GALLERY_FOLDER = 'KOGO';

export interface GalleryImage {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
  bytes?: number;
  format?: string;
}

interface SearchResource {
  public_id: string;
  secure_url: string;
  created_at: string;
  bytes: number;
  format?: string;
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

const cleanName = (originalName: string): string =>
  originalName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(gif|jpe?g|png|webp|avif|heic|bmp|tiff?|svg)$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 80)
    .replace(/^_+|_+$/g, '') || 'imagen';

const isGif = (file: Express.Multer.File): boolean =>
  file.mimetype === 'image/gif' ||
  file.originalname.toLowerCase().endsWith('.gif') ||
  file.buffer.toString('ascii', 0, 6) === 'GIF87a' ||
  file.buffer.toString('ascii', 0, 6) === 'GIF89a';

const friendlyName = (publicId: string): string => publicId.split('/').pop() || publicId;

const isDuplicateError = (error: unknown): boolean => {
  const err = error as { http_code?: number; message?: string };
  return err?.http_code === 409 || /already exists/i.test(String(err?.message || ''));
};

const runUpload = (
  file: Express.Multer.File,
  publicId: string,
  gif: boolean
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: GALLERY_FOLDER,
        public_id: publicId,
        unique_filename: false,
        overwrite: false,
        ...(gif
          ? {}
          : {
              format: 'webp',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            }),
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

const toGalleryImage = (resource: SearchResource): GalleryImage => ({
  id: resource.public_id,
  name: friendlyName(resource.public_id),
  url: resource.secure_url,
  createdAt: resource.created_at,
  bytes: resource.bytes,
  format: resource.format,
});

export const GalleryService = {
  uploadImage: async (file: Express.Multer.File, title?: string): Promise<GalleryImage> => {
    ensureConfig();

    const gif = isGif(file);
    const base = cleanName(title || file.originalname);

    let result: UploadApiResponse;
    try {
      result = await runUpload(file, base, gif);
    } catch (error) {
      if (!isDuplicateError(error)) {
        throw new AppError('No se pudo subir la imagen', 500);
      }
      result = await runUpload(file, `${base}_${Date.now().toString(36)}`, gif);
    }

    return {
      id: result.public_id,
      name: friendlyName(result.public_id),
      url: result.secure_url,
      createdAt: result.created_at,
      bytes: result.bytes,
      format: result.format,
    };
  },

  getGalleryImages: async (): Promise<GalleryImage[]> => {
    ensureConfig();

    const result = await cloudinary.search
      .expression(`resource_type:image AND folder:${GALLERY_FOLDER}`)
      .max_results(100)
      .execute();

    const resources = (result.resources || []) as unknown as SearchResource[];

    return resources.map(toGalleryImage).sort((a, b) => a.name.localeCompare(b.name));
  },

  deleteImage: async (imageId: string): Promise<void> => {
    ensureConfig();

    let decodedId = imageId;
    try {
      decodedId = decodeURIComponent(imageId);
    } catch {
      decodedId = imageId;
    }

    const safeId = decodedId.replace(/[^a-zA-Z0-9_/-]/g, '');
    if (!safeId) {
      throw new AppError('Id de imagen inválido', 400);
    }

    const result = await cloudinary.uploader.destroy(safeId);

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new AppError('No se pudo eliminar la imagen', 500);
    }
  },
};
