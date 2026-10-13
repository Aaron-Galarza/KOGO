'use client';

import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/ui/ProductCard';

interface FeaturedBannerProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function FeaturedBanner({
  products,
  onProductClick,
}: FeaturedBannerProps) {
  const featured = products.filter((p) => p.featured);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <div className="border-b-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-red-50 p-4">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-yellow-800">
        <Flame size={22} />
        Destacados
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {featured.map((product) => (
          <div key={String(product._id)} className="w-48 flex-shrink-0 md:w-56">
            <ProductCard
              product={product}
              onAddClick={() => onProductClick(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
