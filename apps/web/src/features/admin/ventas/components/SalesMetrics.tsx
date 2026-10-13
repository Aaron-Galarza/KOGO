'use client';

import { useEffect, useState } from 'react';
import { fetchAnalyticsStats } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { DollarSign, Package, TrendingUp, Star, Banknote, Building2 } from 'lucide-react';

interface SalesMetricsProps {
  range: string;
  customFrom?: string;
  customTo?: string;
}

export function SalesMetrics({ range, customFrom, customTo }: SalesMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topProduct, setTopProduct] = useState('');
  const [cashTotal, setCashTotal] = useState(0);
  const [transferTotal, setTransferTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchAnalyticsStats(range as any, customFrom, customTo)
      .then((stats) => {
        setMetrics(stats);
        setTopProduct(stats.topProduct ? `${stats.topProduct.title} (x${stats.topProduct.qty})` : '-');
        setCashTotal(stats.totalCash ?? 0);
        setTransferTotal(stats.totalTransfer ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range, customFrom, customTo]);

  if (loading || !metrics) return <p className="text-center py-4 text-[#757575] text-sm">Cargando...</p>;

  const cards = [
    { label: 'Ventas Totales', value: formatCurrency(metrics.totalSales), Icon: DollarSign },
    { label: 'Pedidos Entregados', value: metrics.completedOrders, Icon: Package },
    { label: 'Ticket Promedio', value: formatCurrency(metrics.avgTicket ?? 0), Icon: TrendingUp },
    { label: 'Producto mas vendido', value: topProduct, Icon: Star },
    { label: 'Efectivo', value: formatCurrency(cashTotal), Icon: Banknote },
    { label: 'Transferencia', value: formatCurrency(transferTotal), Icon: Building2 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {cards.map(({ label, value, Icon }) => (
        <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={18} className="text-[#D9383A]" />
            <p className="text-xs sm:text-sm font-medium text-[#757575]">{label}</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#212121] truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}
