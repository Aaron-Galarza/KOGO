'use client';

import { useState } from 'react';
import { Ticket, Plus } from 'lucide-react';
import { createCoupon } from '@/services/admin.service';
import { Coupon } from '@/types';

const DAYS = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mie' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sab' },
  { key: 'sunday', label: 'Dom' },
];

const PAYMENTS = [
  { key: 'cash', label: 'Efectivo' },
  { key: 'transfer', label: 'Transferencia' },
];

interface CouponFormProps {
  onCouponAdded: (c: Coupon) => void;
}

export function CouponForm({ onCouponAdded }: CouponFormProps) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [validDays, setValidDays] = useState<string[]>([]);
  const [validPaymentMethods, setValidPaymentMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const c = await createCoupon({
        code: code.toUpperCase(),
        discountPercent: discount,
        active: true,
        validDays: validDays.length > 0 ? validDays : undefined,
        validPaymentMethods: validPaymentMethods.length > 0 ? validPaymentMethods : undefined,
      });
      onCouponAdded(c);
      setCode('');
      setDiscount(10);
      setValidDays([]);
      setValidPaymentMethods([]);
    } catch (err: any) { setError(err.message || 'Error'); }
    setLoading(false);
  };

  const toggle = (arr: string[], setArr: any, key: string) => {
    setArr(arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Plus size={18} /> Nuevo cupon</h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      <div className="space-y-3">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          placeholder="DESCUENTO10" required disabled={loading} maxLength={20}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D9383A] font-mono uppercase" />
        <div>
          <label className="block text-xs font-semibold mb-1 text-[#212121]">Descuento (%)</label>
          <input type="number" min={1} max={100} value={discount} onChange={(e) => setDiscount(parseInt(e.target.value) || 1)}
            required disabled={loading} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D9383A]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-[#212121]">Dias validos (opcional)</label>
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d) => (
              <button type="button" key={d.key} onClick={() => toggle(validDays, setValidDays, d.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${validDays.includes(d.key) ? 'bg-[#D9383A] text-white' : 'bg-gray-100 text-[#757575] hover:bg-gray-200'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-[#212121]">Metodos de pago (opcional)</label>
          <div className="flex gap-1">
            {PAYMENTS.map((p) => (
              <button type="button" key={p.key} onClick={() => toggle(validPaymentMethods, setValidPaymentMethods, p.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${validPaymentMethods.includes(p.key) ? 'bg-[#D9383A] text-white' : 'bg-gray-100 text-[#757575] hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button type="submit" disabled={loading || !code}
        className="w-full mt-4 bg-[#D9383A] text-white py-2 rounded-lg font-bold hover:bg-[#b52d2f] disabled:bg-gray-400 transition text-sm flex items-center justify-center gap-2">
        <Ticket size={16} /> {loading ? 'Creando...' : 'Crear cupon'}
      </button>
    </form>
  );
}
