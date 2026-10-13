'use client';

import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import { Product, Category } from '@/types';
import { POSProductCard } from './POSProductCard';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryFilter } from '@/features/menu/components/CategoryFilter';

interface POSProductGridProps {
  onProductSelect: (product: Product) => void;
}

export function POSProductGrid({ onProductSelect }: POSProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      Promise.all([menuService.getProducts(), menuService.getCategories()])
        .then(([p, c]) => { if (!cancelled) { setProducts(p); setCategories(c); } })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; window.removeEventListener('focus', onFocus); };
  }, []);

  const filtered = [...products.filter((p) => {
    const catName = typeof p.category === 'object' ? (p.category as any).name : p.category;
    const matchesCat = !selectedCategory || catName === selectedCategory;
    const matchesSearch = !searchQuery || (p.title || p.name).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  })].sort((a, b) => Number(a.price) - Number(b.price));

  if (loading) return <p className="text-center py-8 text-[#757575]">Cargando productos...</p>;

  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
      <div className="flex-shrink-0 border-b border-gray-100">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar producto..." />
        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 p-2 overflow-y-auto flex-1 min-h-0">
        {filtered.map((p) => <POSProductCard key={p._id} product={p} onSelect={() => onProductSelect(p)} />)}
        {filtered.length === 0 && <p className="text-center text-[#757575] py-8 col-span-full">No hay productos</p>}
      </div>
    </div>
  );
}
