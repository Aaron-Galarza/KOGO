'use client';

import { Package } from 'lucide-react';
import { CategoriesManager } from '@/features/admin/productos/components/CategoriesManager';
import { ProductsManager } from '@/features/admin/productos/components/ProductsManager';
import { AdditionalsManager } from '@/features/admin/productos/components/AdditionalsManager';

export default function ProductosPage() {
  return (
    <div className="cart-bg min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2">
          <Package size={22} /> Menu
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4">Administra categorias, productos y adicionales del menu.</p>
        <div className="space-y-6">
          <CategoriesManager />
          <ProductsManager />
          <AdditionalsManager />
        </div>
      </div>
    </div>
  );
}
