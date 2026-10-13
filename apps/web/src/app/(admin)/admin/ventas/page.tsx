'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { SalesMetrics } from '@/features/admin/ventas/components/SalesMetrics';
import { OrdersTable } from '@/features/admin/ventas/components/OrdersTable';
import { OwnerOnly } from '@/components/layout/OwnerOnly';

function VentasContent() {
  const [range, setRange] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  return (
    <div className="cart-bg min-h-screen p-4">
      <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-montserrat)] text-[#212121] mb-1 flex items-center gap-2">
        <DollarSign size={22} /> Estadisticas
      </h1>
      <p className="text-xs sm:text-sm text-[#757575] mb-4">Metricas y detalle de los pedidos entregados.</p>

      {/* Filtros de rango */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['today', 'yesterday', 'week', 'month', 'custom'].map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${range === r ? 'bg-[#D9383A] text-white' : 'bg-white border border-gray-200 text-[#757575] hover:bg-gray-50'}`}>
            {r === 'today' ? 'Hoy' : r === 'yesterday' ? 'Ayer' : r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Personalizado'}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 border rounded text-xs sm:text-sm" />
            <span className="text-xs text-[#757575]">a</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 border rounded text-xs sm:text-sm" />
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        <SalesMetrics range={range} customFrom={customFrom} customTo={customTo} />
        <OrdersTable />
      </div>
    </div>
  );
}

export default function VentasPage() {
  return <OwnerOnly><VentasContent /></OwnerOnly>;
}
