'use client';

import { Bike } from 'lucide-react';
import { Coordinates } from '@/types';
import { useDeliveryQuote } from '../hooks/useDeliveryQuote';
import { AddressAutocomplete } from './AddressAutocomplete';
import { AddressMapPreview } from './AddressMapPreview';
import { DeliveryCostPreview } from './DeliveryCostPreview';
import { DeliveryTypeSelector } from './DeliveryTypeSelector';

interface DeliverySectionProps {
  deliveryType: 'pickup' | 'delivery' | null;
  onDeliveryTypeChange: (type: 'pickup' | 'delivery') => void;
  address: string;
  coordinates: Coordinates | null;
  /** Cambio de texto (mientras escribe): invalida las coordenadas. */
  onAddressChange: (address: string) => void;
  /** Dirección elegida de la lista (con o sin coordenadas). */
  onAddressSelect: (address: string, coordinates: Coordinates | null) => void;
  /** Devuelve el costo y la distancia para el total del pedido. */
  onQuote: (deliveryCost: number, distanceKm: number | null) => void;
  disabled?: boolean;
  hint?: string;
}

/**
 * Bloque de entrega compartido por el checkout público y el POS: misma
 * búsqueda de direcciones, mismo mapa y mismo cálculo de envío.
 */
export function DeliverySection({
  deliveryType,
  onDeliveryTypeChange,
  address,
  coordinates,
  onAddressChange,
  onAddressSelect,
  onQuote,
  disabled = false,
  hint,
}: DeliverySectionProps) {
  const { quote, loading, error } = useDeliveryQuote(
    deliveryType === 'delivery' ? coordinates : null,
    onQuote
  );

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <h2 className="mb-4 flex items-center gap-2 font-[var(--font-montserrat)] text-lg font-bold text-[#212121]">
        <Bike size={18} /> Entrega
      </h2>

      <DeliveryTypeSelector value={deliveryType} onChange={onDeliveryTypeChange} disabled={disabled} />

      {deliveryType === 'delivery' && (
        <div className="mt-4 space-y-3">
          <AddressAutocomplete
            value={address}
            hasCoordinates={Boolean(coordinates)}
            onChange={onAddressChange}
            onSelect={onAddressSelect}
            disabled={disabled}
          />

          <AddressMapPreview coordinates={coordinates} address={address} />

          <DeliveryCostPreview
            deliveryType={deliveryType}
            hasCoordinates={Boolean(coordinates)}
            quote={quote}
            cost={quote?.deliveryCost ?? 0}
            loading={loading}
            error={error}
          />

          {hint && <p className="text-xs text-[#757575]">{hint}</p>}
        </div>
      )}
    </div>
  );
}
