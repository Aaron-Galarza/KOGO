'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { StoreConfig, DaySchedule } from '@/types';

function formatHour(time?: string): string | null {
  if (!time) return null;
  const [h, m] = time.split(':');
  return `${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`;
}

function scheduleHours(todaySchedule?: DaySchedule): string | null {
  if (!todaySchedule?.isStoreOpen) return null;
  const open = formatHour(todaySchedule.openTime);
  const close = formatHour(todaySchedule.closeTime);
  if (!open || !close) return null;
  return `de ${open} a ${close} hs`;
}

export function StoreStatus({ config }: { config: StoreConfig | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!config || !mounted) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const spanishDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = spanishDays[now.getDay()];
  const todaySchedule = config.dailySchedule?.find((d) => d.day === today);

  let isClosedBySchedule = true;
  if (todaySchedule?.isStoreOpen) {
    const [oh, om] = todaySchedule.openTime.split(':').map(Number);
    const [ch, cm] = todaySchedule.closeTime.split(':').map(Number);
    const openMin = oh * 60 + om;
    let closeMin = ch * 60 + cm;
    if (closeMin <= openMin) closeMin += 24 * 60;
    isClosedBySchedule = currentMinutes < openMin || currentMinutes > closeMin;
  }
  const isClosed = !config.isOpen || config.isEmergencyClosed || isClosedBySchedule;
  const hours = scheduleHours(todaySchedule);

  return isClosed ? (
    <div className="mx-auto max-w-[420px] rounded-full bg-red-50 px-6 py-2.5 text-center text-sm font-semibold border border-red-200 shadow-sm">
      <span className="flex items-center justify-center gap-2">
        <XCircle size={16} className="text-red-600 shrink-0" />
        <span className="text-red-700">
          Negocio cerrado{config.emergencyMessage ? ` - ${config.emergencyMessage}` : ''}
          {hours && ` · Hoy atendemos ${hours}`}
        </span>
      </span>
    </div>
  ) : (
    <div className="mx-auto max-w-[420px] rounded-full bg-green-50 px-6 py-2.5 text-center text-sm font-semibold border border-green-200 shadow-sm">
      <span className="flex items-center justify-center gap-2">
        <CheckCircle size={16} className="text-green-600 shrink-0" />
        <span className="text-green-700">
          {hours ? (
            <>
              Abierto - <Clock size={14} className="inline text-green-600" /> {hours}
            </>
          ) : (
            'Abierto - Pedi ahora'
          )}
        </span>
      </span>
    </div>
  );
}
