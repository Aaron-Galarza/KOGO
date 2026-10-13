'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { ProductCard } from '@/components/ui/ProductCard';
import { Product } from '@/types';
import { useCartStore } from '@/stores/cart.store';

interface MenuSectionProps {
  category: string;
  products: Product[];
  className?: string;
  addedId?: string | null;
  priorityId?: string;
}

function gridClass(count: number) {
  if (count === 1) return 'grid-cols-1 justify-items-center';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count === 3) return 'grid-cols-1 md:grid-cols-3';
  return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
}

export const MenuSection = memo(function MenuSection({ category, products, className = '', addedId, priorityId }: MenuSectionProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const handleAdd = useCallback((p: Product) => addToCart(p, []), [addToCart]);

  if (products.length === 0) return null;

  const cols = gridClass(products.length);
  const isSingle = products.length === 1;

  return (
    <section
      id={category.toLowerCase().replace(/\s+/g, '-')}
      className={cn('mb-10 md:mb-12', className)}
    >
      <h2 className="mb-6 text-center font-[var(--font-montserrat)] text-2xl font-black uppercase tracking-[0.15em] text-[#2d3748] md:mb-8 md:text-3xl">
        {category}
      </h2>

      <div className={`mx-auto grid w-full max-w-[1280px] ${cols} gap-y-4 gap-x-3 md:gap-x-4 px-2.5 py-2 md:p-4`}>
        {products.map((p) => (
          <div key={String(p._id)} className={isSingle ? 'w-full max-w-sm sm:max-w-md' : ''}>
            <ProductCard
              product={p}
              onAddClick={() => handleAdd(p)}
              isAdded={addedId === p._id}
              priority={priorityId === String(p._id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
});
