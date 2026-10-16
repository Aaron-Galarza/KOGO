'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bike, CloudRain, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { deliveryService } from '@/services/delivery.service';
import { DeliveryConfig } from '@/types';
import { formatCurrency } from '@/utils/format';
import { getApiError } from '@/utils/apiError';

/**
 * Configuración de envío (admin): tabla de precios por km, radio máximo y
 * recargo por lluvia. Estos valores son los que se cobran en el checkout.
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

  const apply = useCallback((next: DeliveryConfig) => {
    setConfig(next);
    setMaxDeliveryKm(String(next.maxDeliveryKm));
    setExtraRain(String(next.extraRain));
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

  const handleAddRange = async () => {
    const km = parseFloat(newMaxKm);
    const price = parseFloat(newPrice);
    if (!Number.isFinite(km) || km <= 0) { setError('Los km deben ser mayores a 0'); return; }
    if (!Number.isFinite(price) || price < 0) { setError('El precio no puede ser negativo'); return; }
    await run(() => deliveryService.addRange(km, price), 'Rango agregado');
    setNewMaxKm('');
    setNewPrice('');
  };

  const handleSaveGeneral = async () => {
    const km = parseFloat(maxDeliveryKm);
    if (!Number.isFinite(km) || km <= 0) { setError('El radio máximo debe ser mayor a 0'); return; }
    await run(() => deliveryService.updateConfig({ maxDeliveryKm: km }), 'Radio de reparto actualizado');
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
        Precios por distancia real desde el local. El sistema los recalcula al crear cada pedido.
      </p>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>
          <strong>Revisá estos valores:</strong> son los precios que se cobran en el checkout web.
          Los que ves cargados son de ejemplo hasta que los ajustes.
        </span>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {okMessage && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{okMessage}</div>
      )}

      {/* Tabla de rangos */}
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#757575]">Precios por km</h3>
      <div className="mb-3 space-y-2">
        {config?.kmRanges.length === 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            Sin rangos cargados: el envío se coordina por WhatsApp. Agregá al menos uno.
          </div>
        )}
        {config?.kmRanges.map((range) => (
          <div key={range.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm text-[#212121]">
              Hasta <strong>{range.maxKm} km</strong> → <strong>{formatCurrency(range.price)}</strong>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deliveryService.deleteRange(range.id), 'Rango eliminado')}
              className="rounded p-1 text-[#757575] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label={`Eliminar rango hasta ${range.maxKm} km`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
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

      {/* Radio máximo */}
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#757575]">Radio máximo de reparto</h3>
      <div className="mb-4 flex items-end gap-2">
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

      {/* Lluvia */}
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
