'use client';

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Product, Addon, SelectedAddOn } from '@/types';
import { formatCurrency } from '@/utils/format';

interface AddonsModalProps {
  product: Product;
  additionals: Addon[];
  onAdd: (quantity: number, addons: SelectedAddOn[]) => void;
  onClose: () => void;
}

export function AddonsModal({
  product,
  additionals,
  onAdd,
  onClose,
}: AddonsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  const totalAddonsPrice = Object.entries(selectedAddons).reduce((sum, [addonId, qty]) => {
    const addon = additionals.find((a) => a._id === addonId);
    return sum + (addon?.price || 0) * qty;
  }, 0);

  const itemTotal = product.price * quantity + totalAddonsPrice;
  const productTitle = product.title || product.name;

  const handleAddOnClick = (addonId: string | undefined) => {
    if (!addonId) return;
    setSelectedAddons((prev) => ({ ...prev, [addonId]: (prev[addonId] || 0) + 1 }));
  };

  const handleRemoveAddOn = (addonId: string | undefined) => {
    if (!addonId) return;
    setSelectedAddons((prev) => {
      const newQty = (prev[addonId] || 0) - 1;
      if (newQty <= 0) {
        const { [addonId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: newQty };
    });
  };

  const handleAddToCart = () => {
    const cartAddons: SelectedAddOn[] = Object.entries(selectedAddons).map(
      ([addonId, qty]) => {
        const addon = additionals.find((a) => a._id === addonId);
        return {
          _id: addonId,
          addonId,
          name: addon?.name || '',
          title: addon?.name || '',
          price: addon?.price || 0,
          quantity: qty,
        };
      }
    );

    onAdd(quantity, cartAddons);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4 md:items-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white md:max-w-md md:rounded-lg">
        <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b border-gray-200 bg-white p-4 md:rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">{productTitle}</h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-900">Cantidad</label>
            <div className="flex gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex items-center justify-center rounded-full border-2 border-gray-300 px-3 py-2 font-bold transition hover:border-red-600 hover:text-red-600"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 rounded-full border-2 border-gray-300 text-center text-lg font-bold focus:border-red-600 focus:outline-none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex items-center justify-center rounded-full border-2 border-gray-300 px-3 py-2 font-bold transition hover:border-red-600 hover:text-red-600"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {additionals.length > 0 && (
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-gray-900">Adicionales</label>
              <div className="space-y-2">
                {additionals.map((addon) => (
                  <div
                    key={addon._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {addon.name}
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(addon.price)}</p>
                    </div>
                    <div className="flex gap-1">
                      {selectedAddons[addon._id] && selectedAddons[addon._id] > 0 ? (
                        <>
                          <button
                            onClick={() => handleRemoveAddOn(addon._id)}
                            className="flex items-center rounded border-2 border-red-600 px-2 py-1 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="min-w-8 px-2 py-1 text-center text-sm font-semibold">
                            {selectedAddons[addon._id]}
                          </span>
                        </>
                      ) : null}
                      <button
                        onClick={() => handleAddOnClick(addon._id)}
                        className="flex items-center rounded bg-red-600 px-2 py-1 text-sm text-white transition hover:bg-red-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 border-t border-gray-200 pt-4">
            <div className="mb-2 flex justify-between text-gray-700">
              <span>Producto</span>
              <span>{formatCurrency(product.price * quantity)}</span>
            </div>
            {totalAddonsPrice > 0 && (
              <div className="mb-2 flex justify-between text-gray-700">
                <span>Adicionales</span>
                <span>{formatCurrency(totalAddonsPrice)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-red-600">
              <span>Total</span>
              <span>{formatCurrency(itemTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full rounded-full bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 active:scale-95"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
