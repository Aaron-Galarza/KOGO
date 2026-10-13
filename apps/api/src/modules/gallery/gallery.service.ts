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
}

interface SearchResource {
  public_id: string;
  secure_url: string;
  created_at: string;
  bytes: number;
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
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 80)
    .replace(/^_+|_+$/g, '') || 'imagen';

const toGalleryImage = (resource: SearchResource): GalleryImage => ({
  id: resource.public_id,
  name: resource.public_id,
  url: resource.secure_url,
  createdAt: resource.created_at,
  bytes: resource.bytes,
});

export const GalleryService = {
  uploadImage: async (file: Express.Multer.File): Promise<GalleryImage> => {
    ensureConfig();

    const publicId = `${cleanName(file.originalname)}_${Date.now()}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: GALLERY_FOLDER,
          format: 'webp',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(new AppError('No se pudo subir la imagen', 500));
          } else {
            resolve(uploadResult);
          }
        }
      );
      stream.end(file.buffer);
    });

    return {
      id: result.public_id,
      name: file.originalname,
      url: result.secure_url,
      createdAt: result.created_at,
      bytes: result.bytes,
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

    const safeId = imageId.replace(/[^a-zA-Z0-9_/-]/g, '');
    if (!safeId) {
      throw new AppError('Id de imagen inválido', 400);
    }

    const result = await cloudinary.uploader.destroy(safeId);

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new AppError('No se pudo eliminar la imagen', 500);
    }
  },
};