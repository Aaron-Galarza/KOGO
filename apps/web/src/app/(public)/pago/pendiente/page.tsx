'use client';

import { Suspense } from 'react';
import { PagoResultado } from '@/features/checkout/components/PagoResultado';

export default function PagoPendientePage() {
  return (
    <Suspense
      fallback={
        <div className="cart-bg min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D95A2B] border-t-transparent" />
        </div>
      }
    >
      <PagoResultado />
    </Suspense>
  );
}
