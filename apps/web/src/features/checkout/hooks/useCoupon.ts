'use client';

import { useState } from 'react';
import { couponsService } from '@/services/coupons.service';
import { useCartStore } from '@/stores/cart.store';

export function useCoupon() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);
  const paymentMethod = useCartStore((s) => s.paymentMethod);

  const handleApplyCoupon = async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      const coupon = await couponsService.validateCoupon(code, paymentMethod || undefined);
      setCoupon(coupon);
    } catch (err: any) {
      setError(err.message || 'Cupon invalido');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setError(null);
  };

  return { handleApplyCoupon, handleRemoveCoupon, loading, error };
}
