'use client';

import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { fetchConfigStatus, saveSchedule } from '@/services/admin.service';
import { useToast } from '@/hooks/useToast';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function ScheduleConfig() {
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { error, msg, showError, showMsg } = useToast();

  useEffect(() => {
    fetchConfigStatus()
      .then((c) => {
        if (c.dailySchedule) {
          const m: Record<string, any> = {};
          c.dailySchedule.forEach((d: any) => {
            const i = DAYS.indexOf(d.day);
            if (i === -1) return;
            m[DAY_KEYS[i]] = { open: d.openTime, close: d.closeTime, isClosed: !d.isStoreOpen };
          });
          setSchedule(m);
        }
      })
      .catch(() => showError('Error al cargar horarios'));
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const ds = DAYS.map((day, i) => ({
        day, openTime: schedule[DAY_KEYS[i]]?.open || '09:00',
        closeTime: schedule[DAY_KEYS[i]]?.close || '23:00',
        isStoreOpen: !schedule[DAY_KEYS[i]]?.isClosed,
      }));
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
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Clock size={18} /> Horarios</h2>
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
                <button onClick={() => setSchedule({ ...schedule, [k]: { ...d, isClosed: false } })}
                  className="ml-auto px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm font-semibold">Abrir</button>
              </div>
            );
          }
          return (
            <div key={k} className="flex flex-wrap items-center gap-2 p-3 border rounded-lg">
              <span className="w-20 sm:w-28 font-semibold text-xs sm:text-sm">{DAYS[i]}</span>
              <input type="time" value={d?.open || '09:00'} onChange={(e) => setSchedule({ ...schedule, [k]: { ...d, open: e.target.value } })}
                className="px-1.5 sm:px-2 py-1 border rounded text-xs sm:text-sm w-[100px] sm:w-auto" />
              <span className="text-xs sm:text-sm text-[#757575]">a</span>
              <input type="time" value={d?.close || '23:00'} onChange={(e) => setSchedule({ ...schedule, [k]: { ...d, close: e.target.value } })}
                className="px-1.5 sm:px-2 py-1 border rounded text-xs sm:text-sm w-[100px] sm:w-auto" />
              <button onClick={() => setSchedule({ ...schedule, [k]: { ...d, isClosed: true } })}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-xs sm:text-sm font-semibold">Cerrar</button>
            </div>
          );
        })}
      </div>
      <button onClick={save} disabled={loading} className="w-full mt-4 bg-[#D9383A] text-white py-2 rounded-lg font-bold hover:bg-[#b52d2f] disabled:bg-gray-400 transition flex items-center justify-center gap-2">
        <Save size={16} /> {loading ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </div>
  );
}
