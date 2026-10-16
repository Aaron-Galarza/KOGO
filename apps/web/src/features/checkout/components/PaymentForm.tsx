'use client';

import { useCartStore } from '@/stores/cart.store';
import { Banknote, Building2, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  disabled?: boolean;
  /**
   * Muestra la opción de pago online con Mercado Pago.
   * Solo debe activarse en el checkout público: el POS nunca cobra online.
   */
  onlinePayments?: boolean;
}

const baseMethods = [
  { value: 'cash', label: 'Efectivo', description: 'Al retiro/entrega', Icon: Banknote },
  { value: 'transfer', label: 'Transferencia', description: 'Al confirmar pedido', Icon: Building2 },
] as const;

const onlineMethod = {
  value: 'mercadopago',
  label: 'Pagar online con Mercado Pago',
  description: 'Tarjeta, débito o dinero en cuenta',
  Icon: CreditCard,
} as const;

export function PaymentForm({ disabled = false, onlinePayments = false }: PaymentFormProps) {
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);

  const methods = onlinePayments ? [...baseMethods, onlineMethod] : baseMethods;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121]">Forma de pago</h2>
      <div className="space-y-3">
        {methods.map(({ value, label, description, Icon }) => (
          <label key={value}
            className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
              paymentMethod === value ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input type="radio" name="payment" value={value} checked={paymentMethod === value}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer' | 'mercadopago')}
              className="mr-3 w-5 h-5 accent-red-600" disabled={disabled} />
            <Icon size={20} className="mr-2 text-[#757575]" />
            <div>
              <p className="font-semibold text-[#212121]">{label}</p>
              <p className="text-sm text-[#757575]">{description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
