'use client';

import { Package } from 'lucide-react';
import { usePedidos } from '@/features/admin/pedidos/hooks/usePedidos';
import { OrderCard } from '@/features/admin/pedidos/components/OrderCard';
import { OrderNotification } from '@/features/admin/components/OrderNotification';

const STATUSES = ['', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'];
const LABELS: Record<string, string> = {
  '': 'Todos', pending: 'Pendientes', preparing: 'En preparacion', ready: 'Listos', delivered: 'Entregados', cancelled: 'Cancelados',
};

const RANGES = ['today', 'yesterday', 'week', 'month', 'custom', 'all'];
const RANGE_LABELS: Record<string, string> = {
  today: 'Hoy', yesterday: 'Ayer', week: 'Semana', month: 'Mes', custom: 'Personalizado', all: 'Todas',
};

export default function PedidosPage() {
  const { orders, loading, status, setStatus, range, setRange, customFrom, setCustomFrom, customTo, setCustomTo, updatingId, updateStatus } = usePedidos();

  return (
    <div className="cart-bg min-h-screen p-4">
      <OrderNotification />
      <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2">
        <Package size={24} /> Pedidos
      </h1>
      <p className="text-xs sm:text-sm text-[#757575] mb-4">Gestiona los pedidos de la tienda y su estado. Por defecto se muestran los de hoy.</p>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s || 'all'} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                status === s ? 'bg-[#D9383A] text-white' : 'bg-white border border-gray-300 text-[#757575] hover:bg-gray-50'}`}>
              {LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === r ? 'bg-[#D9383A] text-white' : 'bg-white border border-gray-300 text-[#757575] hover:bg-gray-50'}`}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 border rounded text-xs sm:text-sm" />
          <span className="text-xs text-[#757575]">a</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 border rounded text-xs sm:text-sm" />
        </div>
      )}

      {loading ? (
        <p className="text-[#757575]">Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="text-[#757575]">No hay pedidos</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((o) => <OrderCard key={o._id} order={o} onStatusChange={updateStatus} isUpdating={updatingId === o._id} />)}
        </div>
      )}
    </div>
  );
}
