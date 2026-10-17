'use client';

import { Settings } from 'lucide-react';
import { BannersManager } from '@/features/admin/config/components/BannersManager';
import { ScheduleConfig } from '@/features/admin/config/components/ScheduleConfig';
import { DeliverySettings } from '@/features/admin/config/components/DeliverySettings';

export default function ConfigPage() {
  return (
    <div className="cart-bg min-h-screen p-4 pb-8">
      <div className="max-w-6xl mx-auto px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-1 text-[#212121] font-[var(--font-montserrat)] flex items-center gap-2">
          <Settings size={22} className="sm:size-[28px]" /> Configuracion
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4 sm:mb-6">
          Carrusel, horarios y envío a domicilio de la tienda.
        </p>
        {/* Orden fijo: 1) carrusel, 2) horarios, 3) envío. Uno debajo del otro. */}
        <div className="space-y-6">
          <BannersManager />
          <ScheduleConfig />
          <DeliverySettings />
        </div>
      </div>
    </div>
  );
}
