'use client';

import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { CustomerForm } from '@/features/checkout/components/CustomerForm';
import { DeliveryForm } from '@/features/checkout/components/DeliveryForm';
import { PaymentForm } from '@/features/checkout/components/PaymentForm';
import { CouponInput } from '@/features/checkout/components/CouponInput';
import { formatCurrency } from '@/utils/format';
import { ShoppingCart } from 'lucide-react';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDiscount = useCartStore((s) => s.getDiscount);
  const getTotal = useCartStore((s) => s.getTotal);
  const { handleCreateOrder, loading, error } = useCheckout();

  if (items.length === 0) {
    return (
      <div className="cart-bg flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 font-[var(--font-montserrat)] text-3xl font-extrabold text-[#D9383A]">
            <ShoppingCart className="mr-2 inline-block h-8 w-8" />Tu carrito esta vacio
          </h1>
          <Link href="/menu" className="inline-block rounded-xl bg-[#D9383A] px-8 py-3 font-bold text-white hover:bg-[#b52d2f]">Ver menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-bg min-h-screen p-4 pb-32 max-w-2xl mx-auto">
      <Link href="/cart" className="text-[#D9383A] hover:text-[#b52d2f] font-semibold text-sm mb-3 inline-block">
        Volver al carrito
      </Link>
      <h1 className="text-3xl font-bold text-[#212121] font-[var(--font-montserrat)] mb-6">Checkout</h1>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h2 className="font-bold mb-3 text-[#212121] font-[var(--font-montserrat)]">Tu pedido</h2>
          {items.map((item) => (
            <div key={item.cartItemId} className="py-1 border-b border-gray-100 last:border-0">
              <div className="flex justify-between text-sm text-[#4a5568]">
                <span>{item.title || item.name} x{item.quantity}</span>
                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              {item.addOns.length > 0 && (
                <div className="ml-2 text-xs text-[#757575]">
                  {item.addOns.map((a) => (
                    <div key={a._id} className="flex justify-between">
                      <span>+ {a.name}</span>
                      <span>{formatCurrency(a.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
            <div className="flex justify-between text-[#757575]">
              <span>Subtotal</span><span>{formatCurrency(getSubtotal())}</span>
            </div>
            {getDiscount() > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Descuento</span><span>-{formatCurrency(getDiscount())}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-[#D9383A]">
              <span>Total</span><span>{formatCurrency(getTotal())}</span>
            </div>
          </div>
        </div>

        <DeliveryForm disabled={loading} />
        <PaymentForm disabled={loading} />
        <CouponInput disabled={loading} />
        <CustomerForm onSubmit={handleCreateOrder} loading={loading} error={error} />
      </div>
    </div>
  );
}
