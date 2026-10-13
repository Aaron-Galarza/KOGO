'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { ScheduleConfig } from '@/features/admin/config/components/ScheduleConfig';
import { BannersManager } from '@/features/admin/config/components/BannersManager';
import { CouponForm } from '@/features/admin/config/components/CouponForm';
import { CouponsList } from '@/features/admin/config/components/CouponsList';
import { Coupon } from '@/types';

export default function ConfigPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  return (
    <div className="cart-bg min-h-screen p-4 pb-8">
      <div className="max-w-6xl mx-auto px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-1 text-[#212121] font-[var(--font-montserrat)] flex items-center gap-2">
          <Settings size={22} className="sm:size-[28px]" /> Configuracion
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4 sm:mb-6">Horarios, banners y cupones de la tienda.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ScheduleConfig />
          <BannersManager />
          <CouponForm onCouponAdded={(c) => setCoupons([c, ...coupons])} />
          <CouponsList onLoaded={setCoupons} />
        </div>
      </div>
    </div>
  );
}
