'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ChefHat, ShoppingCart, Utensils } from 'lucide-react';
import { fetchAnalyticsStats } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';

const shortcuts = [
  { href: '/admin/cocina', label: 'Cocina', Icon: ChefHat, color: 'text-orange-600' },
  { href: '/admin/pos', label: 'POS', Icon: ShoppingCart, color: 'text-[#D9383A]' },
  { href: '/admin/productos', label: 'Menu', Icon: Utensils, color: 'text-green-600' },
];

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const load = () => fetchAnalyticsStats('today').then(setMetrics).catch(() => {});
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, []);

  return (
    <div className="cart-bg min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-1 text-[#212121] font-[var(--font-montserrat)] flex items-center gap-2">
          <LayoutDashboard size={22} className="sm:size-[28px]" /> Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#757575] mb-4 sm:mb-6">Resumen del dia y acceso rapido.</p>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {shortcuts.map(({ href, label, Icon, color }) => (
            <Link key={href} href={href} className="bg-white rounded-lg p-4 sm:p-6 shadow-md hover:shadow-lg transition flex flex-col items-center gap-2 text-center">
              <Icon size={28} className={`sm:size-[36px] ${color}`} />
              <span className="font-bold text-xs sm:text-sm text-[#212121]">{label}</span>
            </Link>
          ))}
        </div>

        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Ventas Totales', value: formatCurrency(metrics.totalSales), color: 'text-[#D9383A]' },
              { label: 'Pedidos Entregados', value: metrics.completedOrders, color: 'text-blue-600' },
              { label: 'Ticket Promedio', value: formatCurrency(metrics.avgTicket ?? 0), color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-medium text-[#757575] mb-1">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-[#212121]">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
