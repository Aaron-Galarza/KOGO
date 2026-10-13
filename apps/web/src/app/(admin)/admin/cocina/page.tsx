'use client';

import { ChefHat } from 'lucide-react';
import { useKitchenOrders } from '@/features/admin/cocina/hooks/useKitchenOrders';
import { OrderList } from '@/features/admin/cocina/components/OrderList';
import { OrderNotification } from '@/features/admin/components/OrderNotification';

export default function CocinaPage() {
  const { orders, loading, error, updateStatus } = useKitchenOrders();

  if (loading) {
    return <div className="cart-bg min-h-screen flex items-center justify-center"><p className="text-[#757575]">Cargando ordenes...</p></div>;
  }

  return (
    <div className="cart-bg min-h-screen flex flex-col">
      <OrderNotification />
      {error && <p className="text-red-600 text-sm p-2 bg-red-50">{error}</p>}

      <header className="px-4 pt-3 pb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2">
            <ChefHat size={22} /> Cocina
          </h1>
          <p className="text-xs sm:text-sm text-[#757575]">Prepara los pedidos del dia, actualizados en tiempo real.</p>
        </div>
        <span className="text-xs sm:text-sm font-medium text-[#757575] capitalize">
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </header>

      {orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat size={48} className="mx-auto mb-3 text-[#757575]" />
            <p className="text-lg text-[#757575]">No hay ordenes en este momento</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <OrderList orders={orders} onStatusChange={updateStatus} />
        </div>
      )}
    </div>
  );
}
