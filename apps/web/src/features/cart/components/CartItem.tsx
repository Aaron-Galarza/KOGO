'use client';

import { CartItem as CartItemType, Addon, Category, SelectedAddOn } from '@/types';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { AddOnSelector } from '@/components/common/AddOnSelector';

interface CartItemProps {
  item: CartItemType;
  allAdditionals: Addon[];
  allCategories: Category[];
  onIncrement: (addOns: SelectedAddOn[]) => void;
  onDecrement: (cartItemId: string) => void;
  onUpdateAddOns: (cartItemId: string, newAddOns: SelectedAddOn[]) => void;
  onRemove: (cartItemId: string) => void;
}

function getProductCategoryId(pc: unknown, cats: Category[]): string | null {
  if (typeof pc === 'object' && pc !== null && '_id' in pc) return (pc as { _id: string })._id;
  const name = String(pc);
  const found = cats.find((c) => c.name === name);
  return found?._id ?? null;
}

export function CartItem({
  item, allAdditionals, allCategories,
  onIncrement, onDecrement, onUpdateAddOns, onRemove,
}: CartItemProps) {
  const title = item.title || item.name;
  const img = item.image || item.imageUrl;
  const addOns = (item as any).addOns ?? (item as any).addons ?? [];
  const addOnsTotal = addOns.reduce((s: number, a: any) => s + a.price * (a.quantity || 1), 0);
  const subtotal = item.price * item.quantity + addOnsTotal;
  const catId = getProductCategoryId(item.category, allCategories);
  const maxStock = item.controlStock === true ? (item.stock ?? 0) : Infinity;
  const atMaxStock = item.quantity >= maxStock;

  const available = allAdditionals.filter((a) => {
    const cats = (a as any).categories ?? a.associatedProductCategories;
    if (!cats || cats.length === 0) return true;
    return catId ? cats.includes(catId) : true;
  });

  const isSelected = (id: string) => addOns.some((a: any) => a._id === id);

  const handleToggleAddon = (addon: Addon) => {
    const addonId = addon._id;
    if (addOns.some((a: any) => a._id === addonId)) {
      const newAddOns = addOns.filter((a: any) => a._id !== addonId);
      onUpdateAddOns(item.cartItemId, newAddOns);
    } else {
      const addonName = addon.name || (addon as any).title || '';
      const newAddOns = [
        ...addOns,
        { _id: addonId, name: addonName, price: addon.price, quantity: 1 },
      ];
      onUpdateAddOns(item.cartItemId, newAddOns);
    }
  };

  return (
    <div className="rounded-xl border border-[#e0e0e0] bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {img && (
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#f5f5f5] max-sm:h-16 max-sm:w-16">
            <img src={img} alt={title} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#212121] font-[var(--font-montserrat)]">{title}</h3>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-[#757575] font-[var(--font-open-sans)]">Cantidad:</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onDecrement(item.cartItemId)} aria-label="Disminuir cantidad" className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0e0e0] text-sm font-bold text-[#757575] transition hover:border-[#D9383A] hover:text-[#D9383A]">-</button>
              <span className="w-6 text-center text-sm font-bold text-[#212121]">{item.quantity}</span>
              <button
                onClick={() => onIncrement(item.addOns)}
                disabled={atMaxStock}
                aria-label={atMaxStock ? 'Stock máximo alcanzado' : 'Incrementar cantidad'}
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#e0e0e0] text-sm font-bold transition ${
                  atMaxStock ? 'cursor-not-allowed text-gray-300' : 'text-[#757575] hover:border-[#D9383A] hover:text-[#D9383A]'
                }`}>+</button>
            </div>
          </div>

          {available.length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-[#757575] font-[var(--font-open-sans)]">Adicionales disponibles:</p>
              <AddOnSelector
                availableAddOns={available}
                selectedAddOns={addOns}
                onToggle={handleToggleAddon}
              />
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#212121] font-[var(--font-open-sans)]">Subtotal: {formatCurrency(subtotal)}</p>
            <button onClick={() => onRemove(item.cartItemId)} className="flex items-center gap-1 rounded-full border border-[#D9383A] px-3 py-1 text-xs font-semibold text-[#D9383A] transition hover:bg-[#D9383A] hover:text-white">
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
