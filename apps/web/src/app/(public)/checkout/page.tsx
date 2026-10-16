'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { CustomerForm } from '@/features/checkout/components/CustomerForm';
import { DeliverySection } from '@/features/delivery/components/DeliverySection';
import { PaymentForm } from '@/features/checkout/components/PaymentForm';
import { CouponInput } from '@/features/checkout/components/CouponInput';
import { formatCurrency } from '@/utils/format';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDiscount = useCartStore((s) => s.getDiscount);
  const getTotal = useCartStore((s) => s.getTotal);

  const deliveryType = useCartStore((s) => s.deliveryType);
  const setDeliveryType = useCartStore((s) => s.setDeliveryType);
  const deliveryAddress = useCartStore((s) => s.deliveryAddress);
  const deliveryCoordinates = useCartStore((s) => s.deliveryCoordinates);
  const deliveryCost = useCartStore((s) => s.deliveryCost);
  const setDeliveryAddress = useCartStore((s) => s.setDeliveryAddress);
  const setDeliveryCost = useCartStore((s) => s.setDeliveryCost);

  const { handleCreateOrder, loading, error, redirecting } = useCheckout();

  // Dirección escrita a mano sin ubicación exacta: el envío se coordina por
  // WhatsApp, así que pedimos una confirmación explícita antes de seguir.
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const needsAddressConfirmation = deliveryType === 'delivery' && !deliveryCoordinates;

  if (items.length === 0) {
    return (
      <div className="cart-bg flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 font-[var(--font-montserrat)] text-3xl font-extrabold text-[#D95A2B]">
            <ShoppingCart className="mr-2 inline-block h-8 w-8" />Tu carrito esta vacio
          </h1>
          <Link href="/menu" className="inline-block rounded-xl bg-[#D95A2B] px-8 py-3 font-bold text-white hover:bg-[#D94B2B]">Ver menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-bg min-h-screen p-4 pb-32 max-w-2xl mx-auto">
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-8 text-center">
          <Loader2 size={52} className="animate-spin text-[#D95A2B] mb-5" />
          <h2 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
            ¡Listo! Te llevamos a Mercado Pago
          </h2>
          <p className="text-[#757575] max-w-sm">
            Vas a completar el pago dentro de Mercado Pago, de forma segura.
            No cierres esta pantalla.
          </p>
        </div>
      )}
      <Link href="/cart" className="text-[#D95A2B] hover:text-[#D94B2B] font-semibold text-sm mb-3 inline-block">
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
                <span className="font-semibold">{formatCurrency((item.price + (item.precioIngredientesUnidad || 0)) * item.quantity)}</span>
              </div>
              {item.ingredientes.length > 0 && (
                <div className="ml-2 text-xs text-[#757575]">
                  {item.ingredientes.map((o) => (
                    <div key={`${o.grupoId}.${o.ingredienteId}`} className="flex justify-between">
                      <span>• {o.ingredienteNombre}{o.cantidad > 1 ? ` x${o.cantidad}` : ''}</span>
                      <span>{o.precio > 0 ? formatCurrency(o.precio) : ''}</span>
                    </div>
                  ))}
                </div>
              )}
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
            {deliveryType === 'delivery' && (
              <div className="flex justify-between text-[#757575]">
                <span>Envío</span>
                <span>{deliveryCost > 0 ? formatCurrency(deliveryCost) : 'A coordinar'}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-[#D95A2B]">
              <span>Total</span><span>{formatCurrency(getTotal())}</span>
            </div>
          </div>
        </div>

        <DeliverySection
          deliveryType={deliveryType}
          onDeliveryTypeChange={setDeliveryType}
          address={deliveryAddress}
          coordinates={deliveryCoordinates}
          onAddressChange={(address) => setDeliveryAddress(address, null)}
          onAddressSelect={(address, coordinates) => setDeliveryAddress(address, coordinates)}
          onQuote={setDeliveryCost}
          disabled={loading}
        />

        <PaymentForm disabled={loading} onlinePayments />
        <CouponInput disabled={loading} />

        <CustomerForm
          onSubmit={handleCreateOrder}
          loading={loading}
          error={error}
          submitDisabled={needsAddressConfirmation && !addressConfirmed}
          footerNote={
            needsAddressConfirmation ? (
              <label className="flex items-start gap-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={addressConfirmed}
                  onChange={(e) => setAddressConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#D95A2B]"
                />
                <span>
                  Confirmo que la dirección <strong>«{deliveryAddress}»</strong> es correcta y acepto
                  que el costo de envío se coordine por WhatsApp.
                </span>
              </label>
            ) : null
          }
        />
      </div>
    </div>
  );
}
