'use client';

import { Coordinates } from '@/types';

interface AddressMapPreviewProps {
  coordinates: Coordinates | null;
  address?: string;
}

/**
 * Mapa de confirmación visual.
 *
 * Usa el embed público de Google Maps (sin API key ni costo por carga): solo
 * muestra el punto para que el cliente confirme que la ubicación es correcta.
 */
export function AddressMapPreview({ coordinates, address }: AddressMapPreviewProps) {
  if (!coordinates) return null;

  const src = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=16&output=embed&hl=es`;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <iframe
        title={address ? `Mapa de ${address}` : 'Mapa de la ubicación de entrega'}
        src={src}
        className="h-40 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen={false}
      />
    </div>
  );
}
