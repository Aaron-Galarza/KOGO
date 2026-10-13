'use client';

import { useMemo } from 'react';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';

const STATUS_ORDER = ['pending', 'preparing', 'ready'] as const;
const STATUS_TITLES: Record<string, string> = { pending: 'Pendientes', preparing: 'En preparacion', ready: 'Listos' };
const STATUS_DOTS: Record<string, string> = { pending: 'bg-red-600', preparing: 'bg-yellow-600', ready: 'bg-green-600' };
const STATUS_BG_HOVER: Record<string, string> = { pending: 'bg-red-100', preparing: 'bg-yellow-100', ready: 'bg-green-100' };

interface OrderListProps {
  orders: Order[];
  onStatusChange: (id: string, status: string) => void;
}

export function OrderList({ orders, onStatusChange }: OrderListProps) {
  const grouped = useMemo(() => orders.reduce((acc: Record<string, Order[]>, o) => {
    (acc[o.status] = acc[o.status] || []).push(o);
    return acc;
  }, {}), [orders]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (orderId && currentStatus !== targetStatus) {
      onStatusChange(orderId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 sm:p-4">
      {STATUS_ORDER.map((s) => (
        <div
          key={s}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, s)}
          className={`space-y-3 p-3 rounded-lg transition-colors ${(grouped[s]?.length || 0) > 0 ? '' : STATUS_BG_HOVER[s]}`}
        >
          <h2 className="font-extrabold text-lg font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2 sticky top-0 bg-[#f5f5f5] py-2 z-10">
            <span className={`w-3 h-3 rounded-full ${STATUS_DOTS[s]}`} />
            {STATUS_TITLES[s]} ({grouped[s]?.length || 0})
          </h2>
          <div className="space-y-3 min-h-[100px]">
            {grouped[s]?.map((o) => <OrderCard key={o._id} order={o} onStatusChange={onStatusChange} />)}
            {!grouped[s]?.length && (
              <p className="text-[#757575] text-sm italic text-center py-8">
                Arrastra pedidos aqui
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
