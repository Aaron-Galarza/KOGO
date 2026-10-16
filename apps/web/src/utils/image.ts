// ============================================================
// Validación de imágenes ANTES de subirlas.
//
// Ojo: esto es solo para dar una respuesta inmediata en el navegador y no
// gastar una subida al pedo. La validación que manda es la del backend (formato
// real por bytes, peso y resolución), que no se puede saltear.
// ============================================================

export interface ImageLimits {
  maxMb: number;
  minDimension: number;
  maxDimension: number;
  /** Tipos MIME aceptados por el input. */
  accept: string;
  formatsLabel: string;
}

/** Fotos de producto y galería: la que se muestra en las tarjetas del menú. */
export const PRODUCT_IMAGE: ImageLimits = {
  maxMb: 5,
  minDimension: 600,
  maxDimension: 4000,
  accept: 'image/jpeg,image/png,image/webp',
  formatsLabel: 'JPG, PNG o WEBP',
};

/** Banners del carrusel: aceptan GIF (animado). */
export const BANNER_IMAGE: ImageLimits = {
  ...PRODUCT_IMAGE,
  accept: 'image/jpeg,image/png,image/webp,image/gif',
  formatsLabel: 'JPG, PNG, WEBP o GIF',
};

/** Lee el tamaño real del archivo en el navegador. null si no se pudo leer. */
export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

/**
 * Devuelve el mensaje de error, o null si la imagen está bien.
 */
export async function validateImageFile(
  file: File,
  limits: ImageLimits = PRODUCT_IMAGE
): Promise<string | null> {
  const allowedTypes = limits.accept.split(',').map((t) => t.trim());
  if (!file.type || !allowedTypes.includes(file.type)) {
    return `Formato no permitido. Se aceptan ${limits.formatsLabel}.`;
  }

  if (file.size > limits.maxMb * 1024 * 1024) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `La imagen pesa ${mb} MB y el máximo son ${limits.maxMb} MB.`;
  }

  const size = await readImageSize(file);
  if (!size) return 'No se pudo leer la imagen. Probá con otro archivo.';

  // Se mira el lado MAYOR: así un banner ancho y bajo no queda rechazado.
  const longest = Math.max(size.width, size.height);

  if (longest < limits.minDimension) {
    return `La imagen es muy chica (${size.width}x${size.height}px). El lado mayor debe tener al menos ${limits.minDimension}px.`;
  }
  if (longest > limits.maxDimension) {
    return `La imagen es muy grande (${size.width}x${size.height}px). El lado mayor no puede superar los ${limits.maxDimension}px.`;
  }

  return null;
}

/** Texto listo para mostrar en un Hint con todos los límites. */
export function describeLimits(limits: ImageLimits = PRODUCT_IMAGE): string {
  return `${limits.formatsLabel}, hasta ${limits.maxMb} MB y entre ${limits.minDimension}px y ${limits.maxDimension}px de lado mayor. Se convierte a WEBP automáticamente y, en productos, la foto se ajusta a la proporción de la tarjeta sin recortarse.`;
}
