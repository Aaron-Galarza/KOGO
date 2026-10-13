'use client';

import { Order } from '@/types';
import { formatCurrency } from '@/utils/format';

interface OrderTicketProps {
  order: Order;
}

export function OrderTicket({ order }: OrderTicketProps) {
  const discount = (order.subtotal * order.discountPercent) / 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto print:shadow-none print:p-0">
      <div className="text-center mb-6 border-b-4 border-[#D9383A] pb-4">
        <h1 className="text-3xl font-extrabold text-[#D9383A] font-[var(--font-montserrat)]">CHEEPERS</h1>
        <p className="text-[#757575] text-lg font-semibold">Pedido Confirmado</p>
      </div>

      <div className="space-y-1 text-sm mb-4 pb-4 border-b border-gray-300">
        <p className="text-[#757575]">Fecha: {new Date(order.createdAt || '').toLocaleString('es-AR')}</p>
        <p className="text-lg font-bold text-[#212121]">Pedido #{String(order._id).slice(-6).toUpperCase()}</p>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-300">
        <p className="font-bold text-[#212121]">{order.customer.name}</p>
        <p className="text-sm text-[#757575]">{order.customer.phone}</p>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-300">
        <h3 className="font-bold mb-2 text-[#212121]">DETALLE:</h3>
        <div className="space-y-1 text-sm">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <p className="flex justify-between">
                <span>{item.title} x{item.quantity}</span>
                <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
              </p>
              {item.additionals?.map((addon, ai) => (
                <p key={ai} className="text-xs text-[#757575] ml-2">
                  + {addon.name || addon.title} - {formatCurrency(addon.price)}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 mb-4 pb-4 border-b-4 border-[#D9383A] text-sm">
        <div className="flex justify-between text-[#757575]">
          <span>Subtotal:</span><span className="font-semibold">{formatCurrency(order.subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Descuento ({order.discountPercent}%):</span><span>-{formatCurrency(discount)}</span>
          </div>
        )}
        {order.deliveryCost > 0 && (
          <div className="flex justify-between text-[#757575]">
            <span>Envio:</span><span className="font-semibold">{formatCurrency(order.deliveryCost)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-[#D9383A] pt-2">
          <span>TOTAL:</span><span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-center mb-4 pb-4 border-b border-gray-300 text-[#4a5568]">
        <p><strong>Entrega:</strong> {order.deliveryType === 'pickup' ? 'RETIRO' : 'DOMICILIO'}</p>
        <p><strong>Pago:</strong> {order.paymentMethod === 'cash' ? 'EFECTIVO' : 'TRANSFERENCIA'}</p>
      </div>
    </div>
  );
}
