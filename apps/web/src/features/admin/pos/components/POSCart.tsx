'use client';

import { useState, useEffect } from 'react';
import { usePOSCart } from '../hooks/usePOSCart';
import { usePOSStore } from '@/stores/pos.store';
import { menuService } from '@/services/menu.service';
import { formatCurrency } from '@/utils/format';
import { ShoppingCart, Trash2, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Addon, SelectedAddOn } from '@/types';

interface POSCartProps {
  onCheckout: () => void;
}

export function POSCart({ onCheckout }: POSCartProps) {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = usePOSCart();
  const [additionals, setAdditionals] = useState<Addon[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { menuService.getAdditionals().then(setAdditionals).catch(() => {}); }, []);

  const getProductAddons = (item: any) => {
    const catId = typeof item.category === 'object' && item.category !== null
      ? (item.category as any)._id || (item.category as any).name
      : item.category;
    return additionals.filter((a) => {
      const cats = (a as any).categories ?? a.associatedProductCategories;
      if (!cats || cats.length === 0) return true;
      return catId ? cats.some((c: string) => String(c) === String(catId)) : true;
    });
  };

  const toggleAddon = (itemId: string, addon: Addon) => {
    const state = usePOSStore.getState();
    const item = state.items.find((i: any) => i.cartItemId === itemId);
    if (!item) return;
    const current = item.addOns || [];
    const exists = current.find((a: any) => a._id === addon._id);
    const newAddOns = exists
      ? current.filter((a: any) => a._id !== addon._id)
      : [...current, { _id: addon._id, name: addon.name || (addon as any).title || '', price: addon.price, quantity: 1 }];
    usePOSStore.getState().updateAddOns(itemId, newAddOns);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 flex flex-col h-full">
      <h2 className="font-bold text-base md:text-lg mb-2 md:mb-3 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><ShoppingCart size={20} /> Carrito</h2>
      <div className="flex-1 overflow-y-auto space-y-1.5 md:space-y-2 mb-2 md:mb-3">
        {items.length === 0 ? <p className="text-center text-[#757575] py-4 text-sm">Carrito vacio</p> : (
          items.map((item: any) => {
            const id = item.cartItemId;
            const available = getProductAddons(item);
            const isExpanded = expandedId === id;
            const maxStock = item.controlStock === true ? (item.stock ?? 0) : Infinity;
            const atMaxStock = item.quantity >= maxStock;
            return (
              <div key={id} className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="p-1.5 md:p-2 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[11px] md:text-sm truncate">{item.title || item.name}</p>
                    <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => updateQuantity(id, (item.quantity || 1) - 1)} className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-gray-200 rounded text-[10px] md:text-xs hover:bg-gray-300"><Minus size={10} /></button>
                        <span className="text-[10px] md:text-xs font-bold w-4 md:w-5 text-center">{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(id, (item.quantity || 1) + 1)} disabled={atMaxStock} className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded text-[10px] md:text-xs hover:bg-gray-300 ${atMaxStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-200 text-gray-700'}`}><Plus size={10} /></button>
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-[#D9383A]">{formatCurrency(item.price * (item.quantity || 1))}</span>
                    </div>
                    {(item.addOns || []).length > 0 && (
                      <p className="text-[9px] md:text-[10px] text-[#757575] mt-0.5 truncate">{(item.addOns || []).map((a: any) => a.name + (a.quantity > 1 ? ` x${a.quantity}` : '')).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 md:gap-1 ml-1">
                    {available.length > 0 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : id)} className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-gray-200 rounded text-[10px] md:text-xs hover:bg-gray-300">
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}
                    <button onClick={() => removeItem(id)} className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-[#D9383A] text-white rounded text-[10px] md:text-xs hover:bg-[#b52d2f]"><Trash2 size={10} /></button>
                  </div>
                </div>
                {isExpanded && available.length > 0 && (
                  <div className="px-1.5 md:px-2 pb-1.5 md:pb-2 grid grid-cols-2 gap-1">
                    {available.map((a) => {
                      const sel = (item.addOns || []).some((x: any) => x._id === a._id);
                      return (
                        <button key={a._id} onClick={() => toggleAddon(id, a)}
                          className={`text-left p-1.5 rounded text-[10px] font-medium transition ${sel ? 'bg-[#D9383A] text-white' : 'bg-white border border-gray-200 text-[#757575] hover:border-[#D9383A]'}`}>
                          <div className="truncate">{a.name || (a as any).title}</div>
                          <div className={sel ? 'text-white/70' : 'text-[#D9383A]'}>+{formatCurrency(a.price)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="border-t pt-2 mb-2 md:mb-3 flex-shrink-0"><div className="flex justify-between font-bold text-base md:text-lg"><span>Total:</span><span className="text-[#D9383A]">{formatCurrency(subtotal)}</span></div></div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={clearCart} disabled={items.length === 0} className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300 text-xs md:text-sm font-semibold">Limpiar</button>
        <button onClick={onCheckout} disabled={items.length === 0} className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-[#D9383A] text-white rounded-lg hover:bg-[#b52d2f] disabled:bg-gray-300 text-xs md:text-sm font-bold">Checkout</button>
      </div>
    </div>
  );
}
