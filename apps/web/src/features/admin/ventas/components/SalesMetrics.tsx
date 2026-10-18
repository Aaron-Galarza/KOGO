'use client';

import { useEffect, useState } from 'react';
import { fetchAnalyticsStats, type AdminRange } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { DollarSign, Package, TrendingUp, Star, Banknote, Building2, CreditCard } from 'lucide-react';

interface SalesMetricsProps {
  range: AdminRange;
  customFrom?: string;
  customTo?: string;
}

interface SalesStats {
  totalSales: number;
  completedOrders: number;
  avgTicket: number;
  totalCash: number;
  totalTransfer: number;
  topProduct: { title: string; qty: number } | null;
}

export function SalesMetrics({ range, customFrom, customTo }: SalesMetricsProps) {
  const [metrics, setMetrics] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setLoading(true); });
    if (range === 'custom' && (!customFrom || !customTo || customFrom > customTo)) {
      queueMicrotask(() => { if (active) { setMetrics(null); setLoading(false); } });
      return () => { active = false; };
    }
    fetchAnalyticsStats(range, customFrom, customTo)
      .then((stats: SalesStats) => { if (active) setMetrics(stats); })
      .catch(() => { if (active) setMetrics(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range, customFrom, customTo]);

  if (range === 'custom' && (!customFrom || !customTo || customFrom > customTo)) return <p className="text-center py-4 text-[#757575] text-sm">Seleccioná un período válido.</p>;
  if (loading || !metrics) return <p className="text-center py-4 text-[#757575] text-sm">Cargando...</p>;

  const cards = [
    { label: 'Ventas sin envío', value: formatCurrency(metrics.totalSales), Icon: DollarSign },
    { label: 'Pedidos Entregados', value: metrics.completedOrders, Icon: Package },
    { label: 'Ticket Promedio', value: formatCurrency(metrics.avgTicket ?? 0), Icon: TrendingUp },
    { label: 'Producto mas vendido', value: metrics.topProduct ? `${metrics.topProduct.title} (x${metrics.topProduct.qty})` : '-', Icon: Star },
    { label: 'Efectivo', value: formatCurrency(metrics.totalCash ?? 0), Icon: Banknote },
    { label: 'Transferencia', value: formatCurrency(metrics.totalTransfer ?? 0), Icon: Building2 },
    { label: 'Mercado Pago', value: formatCurrency(metrics.totalSales - (metrics.totalCash ?? 0) - (metrics.totalTransfer ?? 0)), Icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {cards.map(({ label, value, Icon }) => (
        <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={18} className="text-[#D95A2B]" />
            <p className="text-xs sm:text-sm font-medium text-[#757575]">{label}</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#212121] truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}
