'use client';

import { useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { useCoupon } from '../hooks/useCoupon';
import { useCartStore } from '@/stores/cart.store';

interface CouponInputProps {
  disabled?: boolean;
}

export function CouponInput({ disabled = false }: CouponInputProps) {
  const [code, setCode] = useState('');
  const { handleApplyCoupon, handleRemoveCoupon, loading, error } = useCoupon();
  const coupon = useCartStore((s) => s.coupon);

  if (coupon) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-green-700 flex items-center gap-1">
              <Ticket size={16} /> Cupon aplicado
            </p>
            <p className="text-sm text-green-600">
              {coupon.code} - {coupon.discountPercent || 0}% descuento
            </p>
          </div>
          <button onClick={() => { setCode(''); handleRemoveCoupon(); }} disabled={disabled}
            className="text-green-700 hover:text-green-900 transition">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="font-bold mb-3 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-1">
        <Ticket size={16} /> Tenes un cupon?
      </h3>
      <div className="flex gap-2">
        <input type="text" placeholder="CODIGO" value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 font-mono uppercase"
          disabled={loading || disabled} />
        <button onClick={() => handleApplyCoupon(code)} disabled={loading || !code.trim() || disabled}
          className="px-4 py-2 bg-[#D9383A] text-white rounded-lg hover:bg-[#b52d2f] disabled:bg-gray-400 transition font-semibold text-sm">
          {loading ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
