// ============================================================
// Utilidades de imagen (galería).
//
// Sin dependencias externas y sin tocar la red: acá viven las reglas puras
// (formato, nombre y transformación) para poder testearlas.
//
// SEGURIDAD: solo se aceptan formatos que se pueden servir tal cual sin riesgo.
// SVG queda afuera a propósito (puede contener scripts), igual que HEIC/BMP/TIFF
// (no se optimizan ni se ven bien en el navegador).
// ============================================================

import { TransformationOptions } from 'cloudinary';
import {
  GALLERY_BANNER_MAX_WIDTH,
  GALLERY_MAX_DIMENSION,
  GALLERY_MIN_DIMENSION,
  GALLERY_PAD_BACKGROUND,
  GALLERY_PRODUCT_ASPECT_RATIO,
  GALLERY_PRODUCT_MAX_WIDTH,
} from '../../constants';

export type GalleryPurpose = 'product' | 'banner';
export type DetectedFormat = 'jpeg' | 'png' | 'webp' | 'gif';

export const GALLERY_PURPOSES: GalleryPurpose[] = ['product', 'banner'];

/** Formatos aceptados por propósito. El GIF solo se acepta en el carrusel. */
export const ALLOWED_FORMATS: Record<GalleryPurpose, DetectedFormat[]> = {
  product: ['jpeg', 'png', 'webp'],
  banner: ['jpeg', 'png', 'webp', 'gif'],
};

export const PURPOSE_LABELS: Record<GalleryPurpose, string> = {
  product: 'JPG, PNG o WEBP',
  banner: 'JPG, PNG, WEBP o GIF',
};

/** Detecta el formato real por los bytes de cabecera (no por la extensión). */
export function detectImageFormat(buffer: Buffer): DetectedFormat | null {
  if (!buffer || buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  const head = buffer.toString('ascii', 0, 6);
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif';

  return null;
}

export function isFormatAllowed(format: DetectedFormat | null, purpose: GalleryPurpose): boolean {
  return format !== null && ALLOWED_FORMATS[purpose].includes(format);
}

/** Nombre seguro para usar como public_id de Cloudinary (sin acentos ni símbolos). */
export function cleanName(originalName: string): string {
  return (
    originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\.(gif|jpe?g|png|webp|avif|heic|bmp|tiff?|svg)$/i, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 80)
      .replace(/^_+|_+$/g, '') || 'imagen'
  );
}

/**
 * Normaliza un public_id recibido del cliente: decodifica, limpia caracteres
 * peligrosos y descarta segmentos de navegación (".."). No agrega la carpeta:
 * el cliente siempre manda el id completo tal como lo devolvió el listado
 * (hay imágenes históricas guardadas fuera de la carpeta).
 */
export function normalizePublicId(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  const segments = decoded
    .replace(/[^a-zA-Z0-9_/-]/g, '')
    .replace(/\.+/g, '')
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..');

  return segments.join('/').replace(/\/+/g, '/');
}

/**
 * Control de resolución. Se mira el LADO MAYOR: es el criterio que describe
 * "la imagen tiene al menos 600 px" sin castigar banners anchos y bajos.
 * Si Cloudinary no informó las dimensiones, no se bloquea la subida (mejor
 * aceptar que rechazar una imagen válida).
 */
export function checkDimensions(
  width?: number,
  height?: number
): { ok: true } | { ok: false; message: string } {
  if (!width || !height) return { ok: true };

  const longest = Math.max(width, height);

  if (longest < GALLERY_MIN_DIMENSION) {
    return {
      ok: false,
      message: `La imagen es muy chica (${width}x${height}px). El lado mayor debe tener al menos ${GALLERY_MIN_DIMENSION}px.`,
    };
  }

  if (longest > GALLERY_MAX_DIMENSION) {
    return {
      ok: false,
      message: `La imagen es muy grande (${width}x${height}px). El lado mayor no puede superar los ${GALLERY_MAX_DIMENSION}px.`,
    };
  }

  return { ok: true };
}

/**
 * Transformación con la que se ENTREGA la imagen (no se guarda una copia: se
 * pide el derivado y Cloudinary lo cachea en su CDN, sin costo por request).
 *
 * - product: se lleva a la proporción canónica 6:5 (la misma de la tarjeta de
 *   producto) rellenando con fondo, así la foto entra completa y NUNCA se ve
 *   recortada. Después se acota el ancho sin agrandar.
 * - banner: solo se acota el ancho (el carrusel recorta por CSS).
 * - GIF: se entrega tal cual para no perder la animación.
 */
export function buildTransformation(
  purpose: GalleryPurpose,
  animated = false
): TransformationOptions[] {
  if (animated) return [];

  if (purpose === 'banner') {
    return [{ width: GALLERY_BANNER_MAX_WIDTH, crop: 'limit' }, { quality: 'auto' }];
  }

  return [
    {
      aspect_ratio: `${GALLERY_PRODUCT_ASPECT_RATIO.width}:${GALLERY_PRODUCT_ASPECT_RATIO.height}`,
      crop: 'pad',
      background: GALLERY_PAD_BACKGROUND,
    },
    { width: GALLERY_PRODUCT_MAX_WIDTH, crop: 'limit' },
    { quality: 'auto' },
  ];
}
