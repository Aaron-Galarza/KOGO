'use client';

import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/utils/format';

interface ComandaPreviewProps {
  items: any[];
  subtotal: number;
  name: string;
  phone: string;
  shippingCost: string;
  appliedCoupon: any;
  onShippingChange: (value: string) => void;
}

export function ComandaPreview({ items, subtotal, name, phone, shippingCost, appliedCoupon, onShippingChange }: ComandaPreviewProps) {
  const deliveryType = useCartStore((s) => s.deliveryType);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const deliveryAddress = useCartStore((s) => s.deliveryAddress);
  const holdPay = paymentMethod || 'cash';
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const shipCost = parseFloat(shippingCost) || 0;
  const total = subtotal - discount + shipCost;

  return (
    <div className="hidden md:flex flex-col bg-gray-50 rounded-lg overflow-y-auto border font-mono text-xs">
      <div className="text-center font-bold text-sm py-2 border-b bg-white">CHEEPERS</div>
      <div className="p-3 space-y-2 flex-1">
        <div className="space-y-1">
          <p><strong>Cliente:</strong> {name || '---'}</p>
          <p><strong>Telefono:</strong> {phone || '---'}</p>
          <p><strong>Entrega:</strong> {deliveryType === 'delivery' ? 'Domicilio' : 'Retiro'}</p>
          {deliveryType === 'delivery' && deliveryAddress && (
            <p className="text-[#757575]">Dir: {deliveryAddress}</p>
          )}
          <p><strong>Pago:</strong> {holdPay === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
        </div>
        <div className="border-t pt-2">
          {items.map((item: any) => (
            <div key={item.cartItemId} className="mb-1">
              <p className="font-semibold">{item.quantity}x {item.title || item.name}</p>
              {(item.addOns || []).map((a: any) => (
                <p key={a._id} className="text-[10px] ml-3 text-[#757575]">+ {a.name}</p>
              ))}
            </div>
          ))}
        </div>
        {deliveryType === 'delivery' && (
          <div className="border-t pt-2">
            <p className="font-semibold mb-1">Costo de envio:</p>
            <input type="number" value={shippingCost} onChange={(e) => onShippingChange(e.target.value)}
              placeholder="0" min={0} step="0.01"
              className="w-full px-2 py-1 border rounded text-xs" />
            {shipCost > 0 && <p className="text-right mt-1">+{formatCurrency(shipCost)}</p>}
          </div>
        )}
        <div className="border-t pt-1.5 text-right font-bold text-xs">
          <p>Sub: {formatCurrency(subtotal)}</p>
          {discount > 0 && <p className="text-green-600">Desc: -{formatCurrency(discount)}</p>}
          {shipCost > 0 && <p>Env: {formatCurrency(shipCost)}</p>}
          <p className="text-sm mt-0.5">TOTAL: {formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
