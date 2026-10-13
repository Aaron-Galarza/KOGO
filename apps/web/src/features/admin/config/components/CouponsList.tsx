'use client';

import { useState, useEffect } from 'react';
import { Ticket, Trash2, Power, PowerOff } from 'lucide-react';
import { fetchAdminCoupons, toggleCouponActive, deleteCoupon } from '@/services/admin.service';
import { Coupon } from '@/types';

interface CouponsListProps {
  onLoaded?: (c: Coupon[]) => void;
}

export function CouponsList({ onLoaded }: CouponsListProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCoupons();
      setCoupons(data);
      onLoaded?.(data);
    } catch { setError('Error al cargar cupones'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string | undefined) => {
    if (!id) return;
    try { const u = await toggleCouponActive(id); setCoupons((c) => c.map((x) => (x._id === id ? u : x))); } catch { setError('Error'); }
  };

  const del = async (id: string | undefined) => {
    if (!id || !confirm('Eliminar cupon?')) return;
    try { await deleteCoupon(id); setCoupons((c) => c.filter((x) => x._id !== id)); } catch { setError('Error'); }
  };

  if (loading) return <p className="text-[#757575] text-sm">Cargando cupones...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Ticket size={18} /> Cupones activos</h2>
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {coupons.length === 0 ? <p className="text-[#757575] text-sm">No hay cupones</p> : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c._id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-semibold text-[#212121]">{c.code}</p>
                <p className="text-sm text-[#757575]">{c.discountPercent}% descuento</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(c._id)} className={`p-2 rounded text-white ${c.active ? 'bg-green-600' : 'bg-gray-400'}`}>{c.active ? <Power size={14} /> : <PowerOff size={14} />}</button>
                <button onClick={() => del(c._id)} className="p-2 bg-red-600 text-white rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
