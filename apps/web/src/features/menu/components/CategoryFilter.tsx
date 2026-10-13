'use client';

import { Category } from '@/types';
import { useMemo, memo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { getCategoryIcon } from '@/features/admin/productos/components/IconPicker';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
}

export const CategoryFilter = memo(function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const active = useMemo(
    () => categories.filter((c) => c.isActive !== false && (c as any).active !== false),
    [categories]
  );

  return (
    <div className="border-b border-[#e0e0e0] bg-[#FFFDF7]">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3 py-2 md:gap-x-5 md:py-3">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold transition md:gap-1.5 md:text-sm ${!selectedCategory ? 'text-[#D9383A]' : 'text-[#757575] hover:text-[#D9383A]'}`}
        >
          <LayoutGrid size={16} className="size-3.5 md:size-[18px]" />
          Todos
        </button>
        {active.map((c) => {
          const Icon = getCategoryIcon(c.icon);
          return (
            <button
              key={c.name}
              onClick={() => onSelectCategory(c.name)}
              className={`flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold transition md:gap-1.5 md:text-sm ${selectedCategory === c.name ? 'text-[#D9383A]' : 'text-[#757575] hover:text-[#D9383A]'}`}
            >
              <Icon size={20} className="size-4 md:size-5" />
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
});
