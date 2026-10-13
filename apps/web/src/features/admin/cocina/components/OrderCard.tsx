'use client';

import { memo } from 'react';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/format';
import { ChefHat, Check, Truck, ArrowLeft, Clock, Printer, User, Phone, Package, DollarSign } from 'lucide-react';
import { printComanda } from '@/utils/comanda';

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-l-4 border-l-red-500 bg-red-50',
  preparing: 'border-l-4 border-l-yellow-500 bg-yellow-50',
  ready: 'border-l-4 border-l-green-500 bg-green-50',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDIENTE',
  preparing: 'PREPARANDO',
  ready: 'LISTO',
};

const NEXT: Record<string, { label: string; status: string; Icon: any; cls: string }[]> = {
  pending: [{ label: 'Preparar', status: 'preparing', Icon: ChefHat, cls: 'bg-yellow-600 hover:bg-yellow-700' }],
  preparing: [
    { label: 'Listo', status: 'ready', Icon: Check, cls: 'bg-green-600 hover:bg-green-700' },
    { label: 'Volver', status: 'pending', Icon: ArrowLeft, cls: 'bg-gray-500 hover:bg-gray-600' },
  ],
  ready: [{ label: 'Entregado', status: 'delivered', Icon: Truck, cls: 'bg-blue-600 hover:bg-blue-700' }],
};

interface OrderCardProps {
  order: Order;
  onStatusChange?: (id: string, status: string) => void;
}

export const OrderCard = memo(function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const next = NEXT[order.status] || [];
  const color = STATUS_COLORS[order.status] || 'bg-white border-gray-200';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('orderId', order._id!);
    e.dataTransfer.setData('currentStatus', order.status);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm ${color}`}
    >
      {/* Header: ID + Status + Print */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-base font-extrabold font-[var(--font-montserrat)] text-[#212121]">
            #{String(order._id).slice(-6).toUpperCase()}
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-red-600 text-white' : order.status === 'preparing' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <button onClick={() => printComanda(order)} className="text-[#757575] hover:text-[#212121] transition p-1">
          <Printer size={16} />
        </button>
      </div>

      {/* Customer info */}
      <div className="flex items-center gap-3 text-xs text-[#757575] mb-2">
        <span className="flex items-center gap-1"><User size={12} /> {order.customer.name}</span>
        <span className="flex items-center gap-1"><Phone size={12} /> {order.customer.phone}</span>
      </div>

      {/* Products - BIG emphasis */}
      <div className="border-t border-b border-dashed border-gray-300 py-2 my-2">
        {order.items.map((item, i) => (
          <div key={i} className="mb-1.5">
            <p className="text-sm font-bold text-[#212121] flex items-center gap-1">
              <Package size={14} className="text-[#D9383A]" />
              {item.quantity}x {item.title}
            </p>
            {item.additionals?.map((a, j) => (
              <p key={j} className="text-xs ml-5 text-[#757575] font-medium">+ {a.name}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Price + Delivery */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-lg font-extrabold text-[#D9383A] flex items-center gap-1">
            <DollarSign size={16} /> {formatCurrency(order.total)}
          </p>
          <p className="text-[10px] text-[#757575]">
            {order.deliveryType === 'pickup' ? 'Retiro' : 'Domicilio'}
          </p>
        </div>
        {order.createdAt && (
          <p className="text-[10px] text-[#757575] flex items-center gap-1">
            <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {onStatusChange && next.length > 0 && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200">
          {next.map(({ label, status, Icon, cls }) => (
            <button key={status} onClick={() => onStatusChange(order._id!, status)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold text-white transition flex items-center justify-center gap-1 ${cls}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
