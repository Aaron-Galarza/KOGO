'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';
import { Utensils, Beef, Flame, Soup, Pizza, IceCreamCone, Sandwich, LayoutGrid, Tag, CupSoda, Cookie, Star, Grid3x3, Croissant, Apple } from 'lucide-react';
import { GiHamburger, GiFrenchFries, GiPizzaSlice, GiSteak, GiDumpling, GiSandwich, GiIceCreamCone, GiFruitBowl, CategoryIconProps } from './categoryIcons';
import type { LucideIcon } from 'lucide-react';

type IconEntry = { name: string; Icon: LucideIcon | ((props: CategoryIconProps) => ReactElement) };

export const CATEGORY_ICON_OPTIONS: IconEntry[] = [
  { name: 'GiHamburger', Icon: GiHamburger },
  { name: 'Beef', Icon: Beef },
  { name: 'GiFrenchFries', Icon: GiFrenchFries },
  { name: 'GiPizzaSlice', Icon: GiPizzaSlice },
  { name: 'Pizza', Icon: Pizza },
  { name: 'GiSandwich', Icon: GiSandwich },
  { name: 'Sandwich', Icon: Sandwich },
  { name: 'GiSteak', Icon: GiSteak },
  { name: 'GiDumpling', Icon: GiDumpling },
  { name: 'GiIceCreamCone', Icon: GiIceCreamCone },
  { name: 'IceCreamCone', Icon: IceCreamCone },
  { name: 'GiFruitBowl', Icon: GiFruitBowl },
  { name: 'Apple', Icon: Apple },
  { name: 'Croissant', Icon: Croissant },
  { name: 'Flame', Icon: Flame },
  { name: 'Soup', Icon: Soup },
  { name: 'Utensils', Icon: Utensils },
  { name: 'CupSoda', Icon: CupSoda },
  { name: 'Cookie', Icon: Cookie },
  { name: 'Star', Icon: Star },
  { name: 'Tag', Icon: Tag },
  { name: 'Grid3x3', Icon: Grid3x3 },
];

export function getCategoryIcon(iconKey?: string): LucideIcon | ((props: CategoryIconProps) => ReactElement) {
  if (iconKey) {
    const found = CATEGORY_ICON_OPTIONS.find((o) => o.name === iconKey);
    if (found) return found.Icon;
  }
  return LayoutGrid;
}

function IconDisplay({ name, size, className }: { name?: string; size: number; className: string }) {
  const found = name ? CATEGORY_ICON_OPTIONS.find((o) => o.name === name) : null;
  const Icon = found?.Icon || LayoutGrid;
  return <Icon size={size} className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-[#D9383A] transition w-full"
      >
        <IconDisplay name={value} size={18} className="text-[#D9383A]" />
        <span className="text-sm text-[#757575]">{value || 'Seleccionar icono'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 w-[280px]">
          {CATEGORY_ICON_OPTIONS.map(({ name, Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => { onChange(name); setOpen(false); }}
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                value === name ? 'bg-[#D9383A] text-white' : 'bg-gray-100 hover:bg-gray-200 text-[#757575]'
              }`}
              title={name}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
