'use client';

import { useEffect, useRef, useState } from 'react';
import { deliveryService } from '@/services/delivery.service';
import { Coordinates, DeliveryQuote } from '@/types';
import { getApiError } from '@/utils/apiError';

interface QuoteEntry {
  /** Clave de coordenadas con la que se resolvió esta entrada. */
  key: string;
  quote: DeliveryQuote | null;
  error: string | null;
}

/**
 * Calcula el costo de envío para unas coordenadas (vista previa).
 *
 * El resultado se informa al contenedor (que lo guarda para el total y para el
 * payload del pedido). Si no hay coordenadas, no se calcula nada: el backend
 * recalcula igual al crear el pedido. El estado de carga se deriva, así no hay
 * renders en cascada.
 */
export function useDeliveryQuote(
  coordinates: Coordinates | null,
  onQuote: (deliveryCost: number, distanceKm: number | null) => void
) {
  const [entry, setEntry] = useState<QuoteEntry | null>(null);
  const onQuoteRef = useRef(onQuote);
  const requestRef = useRef(0);

  useEffect(() => {
    onQuoteRef.current = onQuote;
  }, [onQuote]);

  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;
  const key = lat !== null && lng !== null ? `${lat},${lng}` : null;
  const resolved = Boolean(key) && entry?.key === key;
  const quote = resolved ? entry!.quote : null;
  const error = resolved ? entry!.error : null;
  const loading = Boolean(key) && !resolved;

  useEffect(() => {
    if (lat === null || lng === null) return;

    const requestKey = `${lat},${lng}`;
    const requestId = ++requestRef.current;

    deliveryService
      .calculate(lat, lng)
      .then((result) => {
        if (requestRef.current !== requestId) return;
        setEntry({ key: requestKey, quote: result, error: null });
        onQuoteRef.current(result.deliveryCost, result.distanceKm);
      })
      .catch((err) => {
        if (requestRef.current !== requestId) return;
        setEntry({ key: requestKey, quote: null, error: getApiError(err, 'No pudimos calcular el envío') });
        onQuoteRef.current(0, null);
      });
  }, [lat, lng]);

  return { quote, loading, error };
}
