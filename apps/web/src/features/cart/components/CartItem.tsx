'use client';

import { CartItem as CartItemType, Addon, Category, SelectedAddOn } from '@/types';
import { Trash2, Pencil } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { AddOnSelector } from '@/components/common/AddOnSelector';

interface CartItemProps {
  item: CartItemType;
  allAdditionals: Addon[];
  allCategories: Category[];
  onIncrement: () => void;
  onDecrement: (cartItemId: string) => void;
  onUpdateAddOns: (cartItemId: string, newAddOns: SelectedAddOn[]) => void;
  onEdit?: () => void;
  onRemove: (cartItemId: string) => void;
}

// La categoría del producto puede venir como objeto populado, como id o como
// nombre. Se resuelve siempre al _id para poder cruzar contra los adicionales.
function getProductCategoryId(pc: unknown, cats: Category[]): string | null {
  if (typeof pc === 'object' && pc !== null && '_id' in pc) {
    const obj = pc as { _id?: string; name?: string };
    if (obj._id) return obj._id;
    return obj.name ? cats.find((c) => c.name === obj.name)?._id ?? null : null;
  }
  const value = String(pc);
  return cats.find((c) => c._id === value)?._id ?? cats.find((c) => c.name === value)?._id ?? null;
}

export function CartItem({
  item, allAdditionals, allCategories,
  onIncrement, onDecrement, onUpdateAddOns, onEdit, onRemove,
}: CartItemProps) {
  const title = item.title || item.name;
  const img = item.image || item.imageUrl;
  const addOns: SelectedAddOn[] = item.addOns ?? [];
  const ingredientes = item.ingredientes ?? [];
  const addOnsTotal = addOns.reduce((s, a) => s + a.price * (a.quantity || 1), 0);
  const ingredientesTotal = ingredientes.reduce((s, o) => s + o.precio * (o.cantidad || 1), 0);
  const subtotal = (item.price + ingredientesTotal) * item.quantity + addOnsTotal;
  const isConfigurable = item.tipoProducto === 'configurable' || ingredientes.length > 0;
  const catId = getProductCategoryId(item.category, allCategories);
  const maxStock = item.controlStock === true ? (item.stock ?? 0) : Infinity;
  const atMaxStock = item.quantity >= maxStock;

  const available = allAdditionals.filter((a) => {
    const cats = a.categories ?? [];
    if (cats.length === 0) return true;
    return catId ? cats.some((c) => String(c) === String(catId)) : true;
  });

  const handleToggleAddon = (addon: Addon) => {
    const addonId = addon._id;
    if (addOns.some((a) => a._id === addonId)) {
      const newAddOns = addOns.filter((a) => a._id !== addonId);
      onUpdateAddOns(item.cartItemId, newAddOns);
    } else {
      const addonName = addon.title || '';
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
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#212121] font-[var(--font-montserrat)]">{title}</h3>
            {isConfigurable && onEdit && (
              <button onClick={onEdit} className="flex shrink-0 items-center gap-1 rounded-full border border-[#D95A2B] px-2.5 py-1 text-[11px] font-semibold text-[#D95A2B] transition hover:bg-[#D95A2B] hover:text-white">
                <Pencil size={11} /> Editar
              </button>
            )}
          </div>

          {ingredientes.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {ingredientes.map((o) => (
                <li key={`${o.grupoId}-${o.ingredienteId}`} className="text-xs text-[#757575] font-[var(--font-open-sans)]">
                  <span className="font-semibold text-[#4a5568]">{o.grupoNombre}:</span> {o.ingredienteNombre}
                  {o.cantidad > 1 ? ` x${o.cantidad}` : ''}
                  {o.precio > 0 ? ` (+${formatCurrency(o.precio)})` : ''}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-[#757575] font-[var(--font-open-sans)]">Cantidad:</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onDecrement(item.cartItemId)} aria-label="Disminuir cantidad" className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0e0e0] text-sm font-bold text-[#757575] transition hover:border-[#D95A2B] hover:text-[#D95A2B]">-</button>
              <span className="w-6 text-center text-sm font-bold text-[#212121]">{item.quantity}</span>
              <button
                onClick={onIncrement}
                disabled={atMaxStock}
                aria-label={atMaxStock ? 'Stock máximo alcanzado' : 'Incrementar cantidad'}
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#e0e0e0] text-sm font-bold transition ${
                  atMaxStock ? 'cursor-not-allowed text-gray-300' : 'text-[#757575] hover:border-[#D95A2B] hover:text-[#D95A2B]'
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
            <button onClick={() => onRemove(item.cartItemId)} className="flex items-center gap-1 rounded-full border border-[#D95A2B] px-3 py-1 text-xs font-semibold text-[#D95A2B] transition hover:bg-[#D95A2B] hover:text-white">
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
