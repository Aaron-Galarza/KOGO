'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { POSProductGrid } from '@/features/admin/pos/components/POSProductGrid';
import { POSCart } from '@/features/admin/pos/components/POSCart';
import { usePOSStore } from '@/stores/pos.store';
import { ShoppingCart } from 'lucide-react';

const POSCheckout = dynamic(() => import('@/features/admin/pos/components/POSCheckout').then((m) => ({ default: m.POSCheckout })), { ssr: false });

export default function POSPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const addItem = usePOSStore((s) => s.addItem);

  return (
    <div className="cart-bg h-[calc(100dvh-48px)] md:h-[calc(100dvh-56px)] flex flex-col p-2 md:p-4">
      <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2 flex-shrink-0">
        <ShoppingCart size={22} /> POS
      </h1>
      <p className="text-xs sm:text-sm text-[#757575] mb-3 md:mb-4 flex-shrink-0">Carga productos y cobra al instante.</p>
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="flex-1 min-h-0 lg:col-span-3 flex flex-col">
          <POSProductGrid onProductSelect={(p) => addItem(p, 1, [])} />
        </div>
        <div className="flex-shrink-0 max-h-[35%] min-h-[100px] lg:max-h-none lg:min-h-0 overflow-hidden rounded-lg">
          <div className="lg:sticky lg:top-4 h-full">
            <POSCart onCheckout={() => setShowCheckout(true)} />
          </div>
        </div>
      </div>
      {showCheckout && <POSCheckout onClose={() => setShowCheckout(false)} onSuccess={() => setShowCheckout(false)} />}
    </div>
  );
}
