'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAnalyticsOrders, fetchAnalyticsStats, type AdminRange } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { CreditCard, Download, Package } from 'lucide-react';
import { Order } from '@/types';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 10;
interface OrdersTableProps { range: AdminRange; customFrom: string; customTo: string }

type GroupedRow = {
  type: 'product' | 'addon';
  title: string;
  productTitle: string;
  qty: number;
  revenue: number;
  discount: number;
};

interface AnalyticsStats {
  products: Array<{
    title: string;
    qty: number;
    net: number;
    discount: number;
    addons: Array<{ title: string; qty: number; revenue: number }>;
  }>;
}

export function OrdersTable({ range, customFrom, customTo }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [viewGrouped, setViewGrouped] = useState(false);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const { error: exportError, showError } = useToast(6000);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) { setLoading(true); setShowAll(false); } });
    if (range === 'custom' && (!customFrom || !customTo || customFrom > customTo)) {
      queueMicrotask(() => { if (active) { setOrders([]); setTotal(0); setStats(null); setLoading(false); } });
      return () => { active = false; };
    }
    Promise.all([
      fetchAnalyticsOrders(range, paymentFilter, customFrom || undefined, customTo || undefined),
      fetchAnalyticsStats(range, customFrom || undefined, customTo || undefined),
    ])
      .then(([ordRes, statsRes]) => {
        if (!active) return;
        setOrders(ordRes.orders);
        setTotal(ordRes.total);
        setStats(statsRes);
      })
      .catch(() => { if (active) { setOrders([]); setStats(null); setTotal(0); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range, paymentFilter, customFrom, customTo]);

  const grouped = useMemo<GroupedRow[]>(() => {
    if (!viewGrouped || !stats?.products) return [];
    return stats.products
      .map((p) => [
        {
          type: 'product' as const,
          title: p.title,
          productTitle: p.title,
          qty: p.qty ?? 0,
          revenue: p.net ?? 0,
          discount: p.discount ?? 0,
        },
        ...(p.addons || []).map((a) => ({
          type: 'addon' as const,
          title: a.title,
          productTitle: p.title,
          qty: a.qty ?? 0,
          revenue: a.revenue ?? 0,
          discount: 0,
        })),
      ])
      .flat();
  }, [stats, viewGrouped]);

  const anyDiscount = grouped.some((g) => g.discount > 0);
  const productRows = grouped.filter((g) => g.type === 'product');

  const fmtDate = (d: Date | string | undefined) => {
    const dt = new Date(d || 0);
    return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { exportVentas } = await import('@/utils/exportVentas');
      await exportVentas(orders);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'No se pudo generar el Excel.');
    } finally {
      setExporting(false);
    }
  };

  const displayed = showAll ? orders : orders.slice(0, PAGE_SIZE);

  if (loading) return <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"><p className="text-[#757575] text-sm">Cargando...</p></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-base sm:text-lg font-bold font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><CreditCard size={18} /> Pedidos Entregados</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={viewGrouped} onChange={(e) => setViewGrouped(e.target.checked)} className="w-4 h-4 accent-[#D95A2B]" />
            <span className="text-xs font-medium text-[#757575] flex items-center gap-1"><Package size={14} /> Agrupado</span>
          </label>
          {orders.length > 0 && (
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"><Download size={14} /> {exporting ? 'Preparando...' : 'Exportar'}</button>
          )}
        </div>
      </div>

      {exportError && <p role="alert" className="mb-3 text-sm text-red-700">{exportError}</p>}

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={paymentFilter} disabled={viewGrouped} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white text-[#757575] focus:outline-none focus:border-[#D95A2B] disabled:opacity-50 disabled:cursor-not-allowed">
          <option value="">Todos los pagos</option><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="mercadopago">Mercado Pago</option>
        </select>
        {viewGrouped && <span className="self-center text-xs text-[#757575]">Vista agrupada (todos los pagos)</span>}
      </div>

      {viewGrouped ? (
        grouped.length === 0 ? <p className="text-[#757575] text-sm">Sin datos</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[#757575] text-xs uppercase tracking-wider">
                <th className="py-2 font-medium">Producto</th>
                <th className="py-2 text-right font-medium">Cantidad</th>
                {anyDiscount && <th className="py-2 text-right font-medium">Desc.</th>}
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g, i) => (
                <tr key={i} className={`border-b ${g.type === 'product' ? 'border-gray-50 bg-white' : 'border-gray-50/50 bg-gray-50/30'}`}>
                  <td className={`py-2 ${g.type === 'product' ? 'font-semibold text-[#212121]' : 'text-[#757575] pl-4 text-xs'}`}>
                    {g.type === 'addon' ? `+ ${g.title}` : g.title}
                  </td>
                  <td className={`py-2 text-right ${g.type === 'product' ? 'font-semibold text-[#212121]' : 'text-[#757575] text-xs'}`}>
                    {g.qty}
                  </td>
                  {anyDiscount && (
                    <td className={`py-2 text-right ${g.type === 'product' ? 'text-[10px] text-green-600 font-medium' : 'text-[10px] text-green-600/70'}`}>
                      {g.discount > 0 ? `-${formatCurrency(g.discount)}` : '-'}
                    </td>
                  )}
                  <td className={`py-2 text-right ${g.type === 'product' ? 'font-bold text-[#D95A2B]' : 'text-xs text-[#212121]'}`}>
                    {formatCurrency(g.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-3 font-bold text-sm text-[#212121]">Total</td>
                <td className="py-3 text-right font-bold text-[#212121]">
                  {productRows.reduce((s, g) => s + g.qty, 0)}
                </td>
                {anyDiscount && (
                  <td className="py-3 text-right font-bold text-xs text-green-600">
                    -{formatCurrency(productRows.reduce((s, g) => s + g.discount, 0))}
                  </td>
                )}
                <td className="py-3 text-right font-bold text-base text-[#D95A2B]">
                  {formatCurrency(productRows.reduce((s, g) => s + g.revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )
      ) : orders.length === 0 ? <p className="text-[#757575] text-sm">Sin pedidos entregados</p> : (
        <>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-[#757575] text-xs uppercase tracking-wider"><th className="py-2 font-medium">Fecha/Hora</th><th className="py-2 font-medium">Pedido</th><th className="py-2 font-medium">Pago</th><th className="py-2 text-right font-medium">Total</th></tr></thead>
            <tbody>
              {displayed.map((o) => (
                <tr key={o._id} className="border-b border-gray-50">
                  <td className="py-2 text-xs whitespace-nowrap text-[#757575]">{fmtDate(o.createdAt)}</td>
                  <td className="py-2">
                    {o.items.map((item, i) => (
                      <div key={i}>
                        <span className="font-medium text-[#212121]">{item.quantity}x {item.title}</span>
                        {item.additionals?.map((a, j) => (
                          <span key={j} className="text-xs text-[#757575] ml-2">+{a.name}{a.quantity > 1 ? ` x${a.quantity}` : ''}</span>
                        ))}
                        {item.ingredientes?.map((opt, j) => (
                          <span key={`opt-${j}`} className="text-xs text-[#757575] ml-2">•{opt.ingredienteNombre}{opt.cantidad > 1 ? ` x${opt.cantidad}` : ''}</span>
                        ))}
                      </div>
                    ))}
                    <div className="text-xs text-[#757575] mt-1">
                      {o.deliveryType === 'delivery' ? `Envío: ${formatCurrency(o.deliveryCost || 0)}` : 'Retiro en local'}
                      {o.discountPercent > 0 && ` · Descuento: ${o.discountPercent}%`}
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="text-xs font-medium text-[#757575]">{o.paymentMethod === 'cash' ? 'Efectivo' : o.paymentMethod === 'transfer' ? 'Transferencia' : 'Mercado Pago'}</span>
                    {o.discountPercent > 0 && (
                      <span className="text-[10px] text-green-600 font-medium ml-1">-{o.discountPercent}%</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-semibold text-[#212121]">{formatCurrency(o.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-gray-200"><td colSpan={3} className="py-3 text-right font-bold text-sm text-[#212121]">Total</td><td className="py-3 text-right font-bold text-base text-[#212121]">{formatCurrency(total)}</td></tr></tfoot>
          </table>
          {orders.length > PAGE_SIZE && !showAll && (
            <button onClick={() => setShowAll(true)} className="mt-3 w-full py-2 text-sm font-medium text-[#D95A2B] hover:text-[#D94B2B]">{`Ver mas (${orders.length - PAGE_SIZE} restantes)`}</button>
          )}
        </>
      )}
    </div>
  );
}
