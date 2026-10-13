'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { ShoppingCart, Check, PackageX } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  onAddClick: () => void;
  isAdded?: boolean;
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, onAddClick, isAdded, priority }: ProductCardProps) {
  const title = product.title || product.name;
  const img = product.image || product.imageUrl;
  const isOutOfStock = product.controlStock === true && (product.stock ?? 0) <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[6/5] w-full overflow-hidden bg-gradient-to-b from-[#3a2a1a] to-[#1a1008] sm:aspect-auto sm:h-48 md:h-52 lg:h-56">
        {img ? (
          <Image src={img} alt={title} fill priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw" className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-50' : ''}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#757575]">
            <ShoppingCart size={32} className="sm:size-[40px] md:size-[48px]" />
          </div>
        )}
        {product.promotionalLabel && (
          <span className="absolute top-2 left-2 rounded-full bg-[#F9A825] px-2 py-0.5 text-[10px] font-bold text-white shadow sm:top-3 sm:left-3 sm:px-3 sm:py-1 sm:text-xs">
            {product.promotionalLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 md:p-4">
        <h3 className="mb-1 font-extrabold leading-tight text-[#212121] font-[var(--font-montserrat)] text-sm sm:text-base md:text-lg">
          {title}
        </h3>

        {product.description && (
          <p className="mb-3 leading-relaxed text-[#757575] font-[var(--font-open-sans)] text-xs sm:text-sm line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-extrabold text-[#D9383A] font-[var(--font-montserrat)] text-sm sm:text-base md:text-lg">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={onAddClick}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? 'Sin stock' : undefined}
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-bold text-white transition-all duration-300 px-3 py-1.5 text-xs sm:text-sm ${
              isOutOfStock
                ? 'bg-gray-400 cursor-not-allowed'
                : isAdded
                  ? 'bg-green-500 scale-95'
                  : 'bg-[#D9383A] hover:bg-[#b52d2f] active:scale-95'
            }`}
          >
            {isOutOfStock ? <PackageX size={14} /> : isAdded ? <Check size={14} /> : null}
            {isOutOfStock ? 'Sin stock' : isAdded ? 'Agregado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
});
