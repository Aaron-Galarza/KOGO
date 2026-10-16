'use client';

import { useEffect, useRef, useState } from 'react';
import { Bike, Loader2, MapPin, Search } from 'lucide-react';
import { Coordinates } from '@/types';
import { useAddressSearch } from '../hooks/useAddressSearch';

interface AddressAutocompleteProps {
  value: string;
  /** true si la dirección actual tiene coordenadas confirmadas. */
  hasCoordinates: boolean;
  onChange: (address: string) => void;
  onSelect: (address: string, coordinates: Coordinates | null) => void;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  hasCoordinates,
  onChange,
  onSelect,
  disabled = false,
}: AddressAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const lastEmittedRef = useRef(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading, error, markSelected, searchNow } = useAddressSearch(input, !disabled && open);

  // Sincroniza solo si el valor cambió desde afuera (limpiar, cambiar de pedido).
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setInput(value);
      setOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleChange = (raw: string) => {
    const clean = raw.replace(/<[^>]*>/g, '').slice(0, 120);
    lastEmittedRef.current = clean;
    setInput(clean);
    setOpen(true);
    setActiveIndex(-1);
    onChange(clean);
  };

  const choose = (address: string, coordinates: Coordinates | null) => {
    lastEmittedRef.current = address;
    setInput(address);
    setOpen(false);
    markSelected(address);
    onSelect(address, coordinates);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        const place = results[activeIndex];
        choose(place.formattedAddress, { lat: place.lat, lng: place.lng });
      } else {
        searchNow(input);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder="Calle y número, barrio"
            autoComplete="off"
            maxLength={120}
            disabled={disabled}
            className={`w-full rounded-lg border-2 py-2 pl-9 pr-9 text-sm text-[#212121] focus:outline-none focus:border-[#D95A2B] disabled:bg-gray-100 ${
              hasCoordinates ? 'border-green-300' : 'border-gray-300'
            }`}
          />
          {loading && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#D95A2B]" />
          )}
        </div>
        <button
          type="button"
          onClick={() => searchNow(input)}
          disabled={disabled || input.trim().length < 5}
          className="rounded-lg border-2 border-[#D95A2B] px-3 text-[#D95A2B] transition hover:bg-orange-50 disabled:opacity-40"
          aria-label="Buscar dirección"
        >
          <Search size={16} />
        </button>
      </div>

      {hasCoordinates && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <MapPin size={12} /> Ubicación confirmada
        </p>
      )}

      {open && (input.trim().length >= 5) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((place, index) => (
            <button
              key={place.placeId || `${place.lat},${place.lng}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(place.formattedAddress, { lat: place.lat, lng: place.lng })}
              className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition ${
                activeIndex === index ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#D95A2B]" />
              <span className="text-[#212121]">{place.formattedAddress}</span>
            </button>
          ))}

          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-[#757575]">
              {error
                ? error
                : 'Sin coincidencias. Escribí la altura (ej: 1075) o usá la dirección tal como está.'}
            </div>
          )}

          <button
            type="button"
            onClick={() => choose(input.trim(), null)}
            className="flex w-full items-center gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2 text-left text-xs text-[#757575] transition hover:bg-gray-100"
          >
            <Bike size={14} /> Usar esta dirección sin ubicación exacta (coordinamos el envío por WhatsApp)
          </button>
        </div>
      )}
    </div>
  );
}
