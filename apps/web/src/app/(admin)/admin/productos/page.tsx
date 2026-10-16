'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { CategoriesManager } from '@/features/admin/productos/components/CategoriesManager';
import { ProductsManager } from '@/features/admin/productos/components/ProductsManager';
import { AdditionalsManager } from '@/features/admin/productos/components/AdditionalsManager';
import { IngredientsManager } from '@/features/admin/productos/components/IngredientsManager';
import { OptionGroupsManager } from '@/features/admin/productos/components/OptionGroupsManager';
import { CouponForm } from '@/features/admin/config/components/CouponForm';
import { CouponsList } from '@/features/admin/config/components/CouponsList';
import { Coupon } from '@/types';

export default function ProductosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  return (
    <div className="cart-bg min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2">
          <Package size={22} /> Menu
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4">Administra categorias, ingredientes, grupos de opciones, productos, adicionales y cupones del menu.</p>
        <div className="space-y-6">
          <CategoriesManager />
          <IngredientsManager />
          <OptionGroupsManager />
          <ProductsManager />
          <AdditionalsManager />
          {/* Cupones: van al final del menú (antes estaban en Configuración). */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CouponForm onCouponAdded={(c) => setCoupons([c, ...coupons])} />
            <CouponsList onLoaded={setCoupons} />
          </div>
        </div>
      </div>
    </div>
  );
}
