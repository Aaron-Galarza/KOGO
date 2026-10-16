'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bike, CloudRain, Eraser, Loader2, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { deliveryService } from '@/services/delivery.service';
import { DeliveryConfig, Coordinates } from '@/types';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/apiError';
import { AddressAutocomplete } from '@/features/delivery/components/AddressAutocomplete';
import { AddressMapPreview } from '@/features/delivery/components/AddressMapPreview';
import { Hint } from '@/features/admin/components/Hint';

/**
 * Configuración de envío (admin).
 *
 * El punto de partida es lo primero: desde ahí se miden los km, y de ahí salen
 * el precio por tramo, el radio máximo y el recargo por lluvia. Todo se guarda
 * en la base (no hay valores de ejemplo escondidos en el código).
 */
export function DeliverySettings() {
  const [config, setConfig] = useState<DeliveryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const [maxDeliveryKm, setMaxDeliveryKm] = useState('');
  const [extraRain, setExtraRain] = useState('');
  const [newMaxKm, setNewMaxKm] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Punto de partida
  const [originAddress, setOriginAddress] = useState('');
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null);

  const apply = useCallback((next: DeliveryConfig) => {
    setConfig(next);
    setMaxDeliveryKm(String(next.maxDeliveryKm));
    setExtraRain(String(next.extraRain));
    setOriginAddress(next.originLabel || '');
    setOriginCoords(
      typeof next.originLat === 'number' && typeof next.originLng === 'number'
        ? { lat: next.originLat, lng: next.originLng }
        : null
    );
  }, []);

  useEffect(() => {
    deliveryService
      .fetchConfig()
      .then(apply)
      .catch((err) => setError(getApiError(err, 'No pudimos cargar la configuración de envío')))
      .finally(() => setLoading(false));
  }, [apply]);

  const run = async (action: () => Promise<DeliveryConfig>, message: string) => {
    setBusy(true);
    setError(null);
    setOkMessage(null);
    try {
      apply(await action());
      setOkMessage(message);
    } catch (err) {
      setError(getApiError(err, 'No pudimos guardar los cambios'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveOrigin = async () => {
    if (!originCoords) {
      setError('Buscá la dirección y elegila de la lista para fijar el punto de partida');
      return;
    }
    await run(
      () =>
        deliveryService.updateConfig({
          originLat: originCoords.lat,
          originLng: originCoords.lng,
          originLabel: originAddress.slice(0, 160),
        }),
      'Punto de partida actualizado'
    );
  };

  const handleAddRange = async () => {
    const km = parseFloat(newMaxKm);
    const price = parseFloat(newPrice);
    if (!Number.isFinite(km) || km <= 0) { setError('Los km deben ser mayores a 0'); return; }
    if (!Number.isFinite(price) || price < 0) { setError('El precio no puede ser negativo'); return; }
    await run(() => deliveryService.addRange(km, price), 'Tramo agregado');
    setNewMaxKm('');
    setNewPrice('');
  };

  const handleSaveGeneral = async () => {
    const km = parseFloat(maxDeliveryKm);
    if (!Number.isFinite(km) || km <= 0) { setError('El radio máximo debe ser mayor a 0'); return; }
    await run(() => deliveryService.updateConfig({ maxDeliveryKm: km }), 'Radio de reparto actualizado');
  };

  const handleClearRanges = async () => {
    if (!config || config.kmRanges.length === 0) return;
    if (!confirm('¿Borrar todos los tramos de precio? El envío dejará de cobrarse automático.')) return;
    setBusy(true);
    setError(null);
    setOkMessage(null);
    try {
      let last: DeliveryConfig | null = null;
      for (const range of config.kmRanges) {
        last = await deliveryService.deleteRange(range.id);
      }
      if (last) apply(last);
      setOkMessage('Tabla vaciada');
    } catch (err) {
      setError(getApiError(err, 'No pudimos vaciar la tabla'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleRain = async (isRaining: boolean) => {
    const extra = parseFloat(extraRain);
    await run(
      () => deliveryService.updateRain(isRaining, Number.isFinite(extra) && extra >= 0 ? extra : undefined),
      isRaining ? 'Recargo por lluvia activado' : 'Recargo por lluvia desactivado'
    );
  };

  const handleSaveRain = async () => {
    const extra = parseFloat(extraRain);
    if (!Number.isFinite(extra) || extra < 0) { setError('El recargo no puede ser negativo'); return; }
    await run(() => deliveryService.updateConfig({ extraRain: extra }), 'Recargo por lluvia actualizado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-6 shadow-md">
        <Loader2 className="animate-spin text-[#D95A2B]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-md sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 font-[var(--font-montserrat)] text-xl font-bold text-[#212121]">
        <Bike size={20} /> Envío a domicilio
      </h2>
      <p className="mb-4 text-xs sm:text-sm text-[#757575]">
        Todo se calcula desde el punto de partida. El sistema recalcula el envío en cada pedido.
      </p>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {okMessage && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{okMessage}</div>
      )}

      {/* 1. Punto de partida */}
      <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-[#757575]">
        <MapPin size={14} /> Punto de partida
        <Hint>Desde acá se miden los kilómetros de cada reparto. Si te mudás, cambiá este punto y los precios se recalculan solos.</Hint>
      </h3>
      <div className="mb-3">
        <AddressAutocomplete
          value={originAddress}
          hasCoordinates={Boolean(originCoords)}
          onChange={(address) => {
            setOriginAddress(address);
            setOriginCoords(null);
          }}
          onSelect={(address, coordinates) => {
            setOriginAddress(address);
            setOriginCoords(coordinates);
          }}
          disabled={busy}
          allowWithoutCoordinates={false}
        />
      </div>
      {originCoords && (
        <div className="mb-3">
          <AddressMapPreview coordinates={originCoords} address={originAddress} />
          <p className="mt-1 text-xs text-[#757575]">
            {originCoords.lat.toFixed(6)}, {originCoords.lng.toFixed(6)}
          </p>
        </div>
      )}
      <button
        type="button"
        disabled={busy || !originCoords}
        onClick={handleSaveOrigin}
        className="mb-6 flex items-center gap-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700 disabled:bg-gray-400"
      >
        <Save size={16} /> Guardar punto de partida
      </button>

      {/* 2. Tabla de precios */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#757575]">Precios por km</h3>
        {config && config.kmRanges.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={handleClearRanges}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-[#757575] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Eraser size={13} /> Vaciar
          </button>
        )}
      </div>
      <div className="mb-3 space-y-2">
        {config?.kmRanges.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-[#757575]">
            Todavía no hay tramos cargados. Mientras no haya ninguno, el envío no se cobra
            automático: el pedido avisa que se coordina.
          </p>
        )}
        {config?.kmRanges.map((range) => (
          <div key={range.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm text-[#212121]">
              Hasta <strong>{range.maxKm} km</strong> → <strong>{formatCurrency(range.price)}</strong>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deliveryService.deleteRange(range.id), 'Tramo eliminado')}
              className="rounded p-1 text-[#757575] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label={`Eliminar tramo hasta ${range.maxKm} km`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#757575]">Hasta (km)</label>
          <input
            type="number" min={0.1} step="0.1" value={newMaxKm}
            onChange={(e) => setNewMaxKm(e.target.value)}
            className="w-24 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-[#D95A2B] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#757575]">Precio</label>
          <input
            type="number" min={0} step="1" value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-28 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-[#D95A2B] focus:outline-none"
          />
        </div>
        <button
          type="button" disabled={busy} onClick={handleAddRange}
          className="flex items-center gap-1 rounded-lg bg-[#D95A2B] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D94B2B] disabled:bg-gray-400"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* 3. Radio máximo */}
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#757575]">Radio máximo de reparto</h3>
      <div className="mb-6 flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#757575]">Máximo (km)</label>
          <input
            type="number" min={0.5} step="0.5" value={maxDeliveryKm}
            onChange={(e) => setMaxDeliveryKm(e.target.value)}
            className="w-24 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-[#D95A2B] focus:outline-none"
          />
        </div>
        <button
          type="button" disabled={busy} onClick={handleSaveGeneral}
          className="flex items-center gap-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700 disabled:bg-gray-400"
        >
          <Save size={16} /> Guardar
        </button>
      </div>

      {/* 4. Lluvia */}
      <h3 className="mb-2 flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-[#757575]">
        <CloudRain size={14} /> Recargo por lluvia
      </h3>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-[#212121]">
          <input
            type="checkbox"
            checked={Boolean(config?.isRaining)}
            disabled={busy}
            onChange={(e) => handleToggleRain(e.target.checked)}
            className="h-4 w-4 accent-[#D95A2B]"
          />
          {config?.isRaining ? 'Lluvia activa' : 'Sin lluvia'}
        </label>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#757575]">Recargo</label>
          <input
            type="number" min={0} step="1" value={extraRain}
            onChange={(e) => setExtraRain(e.target.value)}
            className="w-28 rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-[#D95A2B] focus:outline-none"
          />
        </div>
        <button
          type="button" disabled={busy} onClick={handleSaveRain}
          className="flex items-center gap-1 rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700 disabled:bg-gray-400"
        >
          <Save size={16} /> Guardar
        </button>
      </div>
    </div>
  );
}
