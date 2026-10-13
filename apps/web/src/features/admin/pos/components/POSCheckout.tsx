'use client';

import { useState } from 'react';
import { X, Printer, Ticket } from 'lucide-react';
import { usePOSCart } from '../hooks/usePOSCart';
import { useCartStore } from '@/stores/cart.store';
import { ordersService } from '@/services/orders.service';
import { couponsService } from '@/services/coupons.service';
import { formatCurrency } from '@/utils/format';
import { printComanda } from '@/utils/comanda';
import { DeliveryForm } from '@/features/checkout/components/DeliveryForm';
import { PaymentForm } from '@/features/checkout/components/PaymentForm';
import { ComandaPreview } from './ComandaPreview';

interface POSCheckoutProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function POSCheckout({ onClose, onSuccess }: POSCheckoutProps) {
  const { items, subtotal, clearCart } = usePOSCart();
  const deliveryType = useCartStore((s) => s.deliveryType);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const deliveryAddress = useCartStore((s) => s.deliveryAddress);
  const [shippingCost, setShippingCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('00');
  const [useCoupon, setUseCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const c = await couponsService.validateCoupon(couponCode, holdPay);
      setAppliedCoupon(c);
      setCouponMsg(`${c.code} - ${c.discountPercent}% desc`);
    } catch (err: any) { setCouponMsg(err.message || 'Cupon invalido'); setAppliedCoupon(null); }
  };

  const holdPay = paymentMethod || 'cash';
  const holdTotal = subtotal - ((subtotal * (appliedCoupon?.discountPercent || 0)) / 100);

  const createOrder = async () => {
    if (!name.trim()) { setError('Ingresa el nombre del cliente'); return; }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone !== '00' && cleanPhone.length < 10) {
      setError('Telefono invalido (min 10 digitos). Usa "00" para pedidos rapidos sin telefono.');
      return;
    }
    try {
      setLoading(true); setError(null);
      const order = await ordersService.createOrder({
        customer: { name, phone: phone || '00' },
        items: items.map((item: any) => ({
          productId: item._id,
          title: item.title || item.name,
          price: item.price,
          quantity: item.quantity || 1,
          additionals: (item.addOns || []).map((a: any) => ({
            name: a.name, addonId: a._id, price: a.price, quantity: a.quantity || 1,
          })),
        })),
        deliveryType: deliveryType || 'pickup',
        paymentMethod: holdPay,
        deliveryAddress: deliveryAddress || null,
        couponCode: appliedCoupon?.code || null,
      });

      // Print comanda
      const fakeOrder: any = {
        _id: order._id,
        customer: { name, phone },
        createdAt: new Date().toISOString(),
        items: items.map((item: any) => ({
          title: item.title || item.name,
          price: item.price,
          quantity: item.quantity || 1,
          additionals: (item.addOns || []).map((a: any) => ({ name: a.name, quantity: a.quantity || 1, price: a.price })),
        })),
        deliveryType: deliveryType || 'pickup',
        paymentMethod: holdPay,
        total: subtotal,
        delivery: { address: deliveryAddress || '' },
      };
      const discountAmount = (subtotal * (appliedCoupon?.discountPercent || 0)) / 100;
      printComanda(fakeOrder, parseFloat(shippingCost) || undefined, appliedCoupon ? discountAmount : undefined);
      clearCart();
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Error'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-extrabold font-[var(--font-montserrat)] text-[#212121]">
            Checkout - {formatCurrency(subtotal)}
          </h2>
          <button onClick={onClose} className="text-[#757575] hover:text-[#212121]"><X size={20} /></button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-hidden">
          {/* Left: Forms */}
          <div className="md:col-span-2 overflow-y-auto pr-1 space-y-4">
            <DeliveryForm disabled={loading} />
            <PaymentForm disabled={loading} />

            <div className="bg-white rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121]">Datos del cliente</h2>
              {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <button type="button" onClick={() => { setUseCoupon(!useCoupon); setCouponCode(''); setCouponMsg(null); setAppliedCoupon(null); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${useCoupon ? 'bg-[#D9383A] text-white' : 'bg-gray-100 text-[#757575]'}`}>
                  <Ticket size={14} /> Cupon? {useCoupon ? 'Si' : 'No'}
                </button>
                {useCoupon && (
                  <div className="flex gap-1 flex-1">
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="Codigo" className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-[#D9383A]" maxLength={20} />
                    <button type="button" onClick={applyCoupon} className="px-3 py-2 bg-[#D9383A] text-white rounded-lg text-xs font-semibold hover:bg-[#b52d2f]">Aplicar</button>
                  </div>
                )}
              </div>
              {couponMsg && (
                <p className={`text-xs -mt-2 ${appliedCoupon ? 'text-green-600' : 'text-red-600'}`}>{couponMsg}</p>
              )}

              <div className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del cliente" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefono" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
                <button onClick={createOrder} disabled={loading || !name.trim()}
                  className="w-full py-3 bg-[#D9383A] text-white rounded-xl font-bold hover:bg-[#b52d2f] disabled:bg-gray-400 transition text-lg flex items-center justify-center gap-2">
                  <Printer size={20} /> {loading ? 'Creando...' : 'Crear pedido + Imprimir'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Comanda preview */}
          <ComandaPreview items={items} subtotal={subtotal} name={name} phone={phone}
            shippingCost={shippingCost} appliedCoupon={appliedCoupon} onShippingChange={setShippingCost} />
        </div>
      </div>
    </div>
  );
}
