'use client';

import { useState, memo } from 'react';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Calendar, User, Phone, Package, CreditCard, Printer } from 'lucide-react';
import { printComanda } from '@/utils/comanda';
import { updateOrderDeliveryCost } from '@/services/admin.service';

function formatWhatsApp(phone: string, order: Order): string {
  const digits = phone.replace(/\D/g, '');
  const base = digits.startsWith('54') ? digits : `54${digits}`;
  const items = order.items.map((i) => {
    const hasAdds = i.additionals && i.additionals.length > 0;
    const hasOpts = i.ingredientes && i.ingredientes.length > 0;
    return `- ${i.title}${i.quantity > 1 ? ` x${i.quantity}` : ''}${hasAdds ? ' %2Badicionales' : ''}${hasOpts ? ' %2Bopciones' : ''}`;
  }).join('%0A');
  const total = `$${order.total?.toLocaleString('es-AR')}`;
  const msg = `Hola ${order.customer.name}!%0A%0ATu pedido en KOGO:%0A%0A${items}%0A%0ATotal: ${total}%0AEstado: En preparacion%0A%0ARecibimos tu pedido, algun detalle mas que desees agregar?`;
  return `https://wa.me/${base}?text=${msg}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-[#D95A2B]',
  'preparing': 'text-yellow-600',
  ready: 'text-blue-600',
  delivered: 'text-green-600',
  cancelled: 'text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  'preparing': 'En preparacion',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ALL_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

// Estado de pago (SEPARADO del estado del pedido). Es lo que permite ver de un
// vistazo si un pedido online ya está cobrado.
function paymentBadge(order: Order): { label: string; className: string } {
  const ps = order.paymentStatus ?? 'not_required';

  if (order.paymentMethod === 'mercadopago') {
    switch (ps) {
      case 'approved':
        return { label: 'Pagado', className: 'bg-green-100 text-green-700 border-green-300' };
      case 'pending':
      case 'in_process':
        return { label: 'Pago pendiente', className: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 'rejected':
        return { label: 'Pago rechazado', className: 'bg-red-100 text-red-700 border-red-300' };
      case 'cancelled':
        return { label: 'Pago cancelado', className: 'bg-red-100 text-red-700 border-red-300' };
      case 'refunded':
        return { label: 'Reembolsado', className: 'bg-blue-100 text-blue-700 border-blue-300' };
      default:
        return { label: 'Sin cobrar', className: 'bg-gray-100 text-gray-600 border-gray-300' };
    }
  }

  return order.paymentMethod === 'cash'
    ? { label: 'A cobrar', className: 'bg-gray-100 text-gray-600 border-gray-300' }
    : { label: 'Confirmar transferencia', className: 'bg-gray-100 text-gray-600 border-gray-300' };
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
  isUpdating?: boolean;
}

export const OrderCard = memo(function OrderCard({ order, onStatusChange, isUpdating }: OrderCardProps) {
  const [confirmDelivered, setConfirmDelivered] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState('');

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'delivered' && order.status !== 'delivered') {
      setConfirmDelivered(true);
      return;
    }
    onStatusChange(order._id!, newStatus);
  };

  const confirmDelivery = () => {
    onStatusChange(order._id!, 'delivered');
    setConfirmDelivered(false);
  };

  const isDelivered = order.status === 'delivered';
  const isToday = order.createdAt ? new Date(order.createdAt).toDateString() === new Date().toDateString() : false;

  const handlePrint = () => {
    if (order.deliveryType === 'delivery') {
      // Se precarga el envío ya calculado: solo se cambia si hace falta.
      setShippingCost(order.deliveryCost ? String(order.deliveryCost) : '');
      setShowShipping(true);
    } else {
      printComanda(order);
    }
  };

  const handleShippingSubmit = async () => {
    const parsed = parseFloat(shippingCost);
    const cost = Number.isFinite(parsed) && parsed >= 0 ? parsed : (order.deliveryCost ?? 0);
    if (cost !== (order.deliveryCost ?? 0)) {
      try { await updateOrderDeliveryCost(order._id!, cost); } catch {}
    }
    printComanda(order, cost);
    setShowShipping(false);
    setShippingCost('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-[#f5f5f5] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-[#757575]">
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1"><Calendar size={14} /> {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-AR') + ' ' + new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          {isToday && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D95A2B] text-white">HOY</span>
          )}
        </span>
        <span className="flex items-center gap-1"><User size={14} /> {order.customer.name}</span>
        <a href={formatWhatsApp(order.customer.phone, order)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#757575] hover:text-green-600 transition font-semibold">
          <Phone size={14} /> {order.customer.phone}
        </a>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#212121] flex items-center gap-2"><Package size={16} /> Productos:</h3>
          <button onClick={handlePrint} className="text-[#757575] hover:text-[#212121] transition"><Printer size={16} /></button>
        </div>

        <div className="space-y-1.5 mb-3">
          {order.items.map((item, i) => (
            <div key={i}>
              <p className="text-sm text-[#212121] font-bold">
                {item.quantity}x {item.title}
              </p>
              {item.additionals && item.additionals.length > 0 && (
                <div className="ml-2 mt-0.5">
                  {item.additionals.map((a, j) => (
                    <p key={j} className="text-sm text-[#757575] font-medium">
                      &#8627; {a.name} <span className="text-[10px] text-[#D95A2B]">- {formatCurrency(a.price)}</span>
                    </p>
                  ))}
                </div>
              )}
              {item.ingredientes && item.ingredientes.length > 0 && (
                <div className="ml-2 mt-0.5">
                  {item.ingredientes.map((o, j) => (
                    <p key={`opt-${j}`} className="text-sm text-[#757575] font-medium">
                      &#8226; {o.ingredienteNombre}{o.cantidad > 1 ? ` x${o.cantidad}` : ''}{o.precio > 0 && <span className="text-[10px] text-[#D95A2B]"> - {formatCurrency(o.precio)}</span>}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-200 pt-2 mb-2">
          <p className="text-sm font-bold text-[#212121] flex items-center gap-2"><CreditCard size={14} /> Total: {formatCurrency(order.total)}</p>
          {order.discountPercent > 0 && (
            <p className="text-xs text-green-600 font-medium mt-0.5">
              Cupon aplicado: {order.couponCode} ({order.discountPercent}% desc)
            </p>
          )}
        </div>

        <div className="text-sm space-y-1.5">
          <p><span className="font-semibold text-[#212121]">Entrega:</span> {order.deliveryType === 'pickup' ? 'Retiro en sucursal' : 'Domicilio'}</p>
          {order.deliveryType === 'delivery' && order.delivery?.address && (
            <p className="font-semibold text-[#212121] text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1">
              {order.delivery.address}
            </p>
          )}
          {order.deliveryType === 'delivery' && (
            <p className="text-xs text-[#757575]">
              Envío: <span className="font-semibold text-[#212121]">{formatCurrency(order.deliveryCost ?? 0)}</span>
              {order.delivery?.distanceKm ? ` · ${order.delivery.distanceKm} km` : ''}
              {!order.deliveryCost ? ' · a coordinar' : ''}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-2">
            <span><span className="font-semibold text-[#212121]">Pago:</span> {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${paymentBadge(order).className}`}>
              {paymentBadge(order).label}
            </span>
          </p>
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-[#212121]">Estado:</span>
          <span className={`text-sm font-bold ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
        </div>

        {/* Status select */}
        {!isDelivered && (
          <div className="mt-2">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D95A2B] bg-white disabled:opacity-50 disabled:cursor-wait"
            >
              {isUpdating && <option value="">Actualizando...</option>}
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Confirmation modal */}
        {confirmDelivered && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <p className="text-lg font-bold mb-4 text-[#212121]">Confirmar entrega</p>
              <p className="text-sm text-[#757575] mb-4">Seguro quieres cambiar el estado del pedido a Entregado? Esta accion no se puede deshacer.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelivered(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-[#212121] rounded-lg font-semibold hover:bg-gray-400">Cancelar</button>
                <button onClick={confirmDelivery}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Shipping cost modal */}
        {showShipping && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <p className="text-lg font-bold mb-2 text-[#212121]">Costo de envio</p>
              <p className="text-sm text-[#757575] mb-4">Costo de envio para {order.customer.name}. Ya viene calculado por distancia; cambialo solo si hace falta.</p>
              <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0" min={0} step="0.01" autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-[#D95A2B] mb-4" />
              <div className="flex gap-2">
                <button onClick={() => { setShowShipping(false); setShippingCost(''); }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-[#212121] rounded-lg font-semibold hover:bg-gray-400">Cancelar</button>
                <button onClick={handleShippingSubmit}
                  className="flex-1 px-4 py-2 bg-[#D95A2B] text-white rounded-lg font-semibold hover:bg-[#D94B2B]">Imprimir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
