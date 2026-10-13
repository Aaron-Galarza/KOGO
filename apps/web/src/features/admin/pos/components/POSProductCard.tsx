'use client';

import { memo } from 'react';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { ShoppingCart, PackageX } from 'lucide-react';

interface POSProductCardProps {
  product: Product;
  onSelect: () => void;
}

export const POSProductCard = memo(function POSProductCard({ product, onSelect }: POSProductCardProps) {
  const title = product.title || product.name;
  const img = product.image || product.imageUrl;
  const isOutOfStock = product.controlStock === true && (product.stock ?? 0) <= 0;

  return (
    <button onClick={onSelect} disabled={isOutOfStock} className={`relative flex flex-col rounded-lg bg-white shadow-sm transition-all ${isOutOfStock ? 'cursor-not-allowed' : 'hover:shadow-md active:scale-95'}`}>
      <div className="h-24 w-full overflow-hidden rounded-t-lg bg-[#f5f5f5] sm:h-28 md:h-28">
        {img ? (
          <img src={img} alt={title} className={`h-full w-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`} loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#757575]"><ShoppingCart size={36} /></div>
        )}
      </div>
      <div className="flex min-h-[60px] flex-col justify-between rounded-b-lg p-2">
        <h3 className="line-clamp-2 text-[11px] font-bold leading-tight text-[#212121]">{title}</h3>
        <p className="text-[13px] font-extrabold text-[#D9383A]">{formatCurrency(product.price)}</p>
      </div>
      {isOutOfStock && (
        <span className="absolute inset-x-0 top-0 flex items-center justify-center gap-1 rounded-t-lg bg-black/60 py-1 text-[10px] font-bold text-white">
          <PackageX size={12} /> Sin stock
        </span>
      )}
    </button>
  );
});
