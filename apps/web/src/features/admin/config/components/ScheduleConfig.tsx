'use client';

import { useState, useEffect } from 'react';
import { Clock, Save, Plus, X } from 'lucide-react';
import { fetchConfigStatus, saveSchedule } from '@/services/admin.service';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface DayRange {
  open: string;
  close: string;
}

interface DayState {
  isClosed: boolean;
  ranges: DayRange[];
}

const DEFAULT_RANGES: DayRange[] = [
  { open: '11:30', close: '14:00' },
  { open: '18:30', close: '23:00' },
];

export function ScheduleConfig() {
  const [schedule, setSchedule] = useState<Record<string, DayState>>({});
  const [loading, setLoading] = useState(false);
  const { error, msg, showError, showMsg } = useToast();

  useEffect(() => {
    fetchConfigStatus()
      .then((c) => {
        if (c.dailySchedule) {
          const m: Record<string, DayState> = {};
          c.dailySchedule.forEach((d: any) => {
            const i = DAYS.indexOf(d.day);
            if (i === -1) return;
            m[DAY_KEYS[i]] = {
              isClosed: !d.isStoreOpen,
              ranges: Array.isArray(d.ranges) ? d.ranges.map((r: any) => ({ open: r.open, close: r.close })) : [],
            };
          });
          setSchedule(m);
        }
      })
      .catch(() => showError('Error al cargar horarios'));
  }, []);

  const setRange = (key: string, index: number, field: 'open' | 'close', value: string) => {
    const day = schedule[key] || { isClosed: false, ranges: [] };
    const ranges = day.ranges.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setSchedule({ ...schedule, [key]: { ...day, ranges } });
  };

  const addRange = (key: string) => {
    const day = schedule[key] || { isClosed: false, ranges: [] };
    setSchedule({ ...schedule, [key]: { ...day, isClosed: false, ranges: [...day.ranges, { open: '18:30', close: '23:00' }] } });
  };

  const removeRange = (key: string, index: number) => {
    const day = schedule[key] || { isClosed: false, ranges: [] };
    setSchedule({ ...schedule, [key]: { ...day, ranges: day.ranges.filter((_, i) => i !== index) } });
  };

  const toggleDay = (key: string, open: boolean) => {
    const day = schedule[key] || { isClosed: true, ranges: [] };
    setSchedule({
      ...schedule,
      [key]: open
        ? { isClosed: false, ranges: day.ranges.length ? day.ranges : DEFAULT_RANGES.map((r) => ({ ...r })) }
        : { ...day, isClosed: true },
    });
  };

  const save = async () => {
    try {
      setLoading(true);
      const ds = DAYS.map((day, i) => {
        const d = schedule[DAY_KEYS[i]];
        const isStoreOpen = !d?.isClosed;
        return {
          day,
          isStoreOpen,
          ranges: isStoreOpen && d?.ranges?.length ? d.ranges : [],
        };
      });
      await saveSchedule(ds);
      showMsg('Horarios actualizados');
    } catch {
      showError('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Clock size={18} /> Horarios <Hint>Definí en qué días y horarios la tienda acepta pedidos.</Hint></h2>
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-4 text-sm">{msg}</p>}
      <div className="space-y-2">
        {DAY_KEYS.map((k, i) => {
          const d = schedule[k];
          if (d?.isClosed) {
            return (
              <div key={k} className="flex flex-wrap items-center gap-2 p-3 border rounded-lg">
                <span className="w-20 sm:w-28 font-semibold text-xs sm:text-sm">{DAYS[i]}</span>
                <span className="text-xs sm:text-sm text-[#757575]">Cerrado</span>
                <button onClick={() => toggleDay(k, true)}
                  className="ml-auto px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm font-semibold">Abrir</button>
              </div>
            );
          }

          const ranges = d?.ranges ?? [];
          return (
            <div key={k} className="flex flex-col gap-2 p-3 border rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 sm:w-28 font-semibold text-xs sm:text-sm">{DAYS[i]}</span>
                <span className="flex items-center gap-1 text-xs sm:text-sm text-[#757575]">Turnos: <Hint>Cada turno es una franja de apertura (de tal hora a tal hora). Podés agregar varios por día.</Hint></span>
                <button onClick={() => addRange(k)}
                  className="ml-auto flex items-center gap-1 px-3 py-1 bg-[#D95A2B] text-white rounded text-xs sm:text-sm font-semibold">
                  <Plus size={13} /> Turno
                </button>
                <button onClick={() => toggleDay(k, false)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm font-semibold">Cerrar</button>
              </div>

              {ranges.length === 0 && (
                <span className="text-xs sm:text-sm text-[#757575]">Sin turnos. Agregá uno para abrir este día.</span>
              )}

              {ranges.map((r, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                  <input type="time" value={r.open} onChange={(e) => setRange(k, idx, 'open', e.target.value)} title="Hora de apertura"
                    className="px-1.5 sm:px-2 py-1 border rounded text-xs sm:text-sm w-[100px] sm:w-auto" />
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-[#757575]">a <Hint>Hora en que abre y en que cierra este turno.</Hint></span>
                  <input type="time" value={r.close} onChange={(e) => setRange(k, idx, 'close', e.target.value)} title="Hora de cierre"
                    className="px-1.5 sm:px-2 py-1 border rounded text-xs sm:text-sm w-[100px] sm:w-auto" />
                  <button onClick={() => removeRange(k, idx)} title="Quitar turno"
                    className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16} /></button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <button onClick={save} disabled={loading} className="w-full mt-4 bg-[#D95A2B] text-white py-2 rounded-lg font-bold hover:bg-[#D94B2B] disabled:bg-gray-400 transition flex items-center justify-center gap-2">
        <Save size={16} /> {loading ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </div>
  );
}
