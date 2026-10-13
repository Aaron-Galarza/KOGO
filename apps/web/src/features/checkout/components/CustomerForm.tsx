'use client';

import { useState } from 'react';
import { User, Phone } from 'lucide-react';

function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

function sanitizePhone(value: string): string {
  return value.replace(/[^\d+\-() ]/g, '').trim();
}

interface CustomerFormData {
  name: string;
  phone: string;
}

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  loading: boolean;
  error?: string | null;
}

export function CustomerForm({ onSubmit, loading, error }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>({ name: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const clean = name === 'phone' ? sanitizePhone(value) : sanitize(value);
    setForm((p) => ({ ...p, [name]: clean }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const name = sanitize(form.name);
    const phone = sanitizePhone(form.phone);
    if (!name) errs.name = 'El nombre es requerido';
    else if (name.length < 2) errs.name = 'Minimo 2 caracteres';
    if (!phone) errs.phone = 'El telefono es requerido';
    else if (phone !== '00' && phone.replace(/\D/g, '').length < 10) errs.phone = 'El telefono debe tener al menos 10 digitos';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ name, phone });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121]">Tus datos</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1 text-[#212121]">Nombre completo</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]" />
            <input type="text" name="name" placeholder="Juan Perez" value={form.name}
              onChange={handleChange} disabled={loading} maxLength={80}
              className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg focus:outline-none transition ${
                errors.name ? 'border-red-600' : 'border-gray-300 focus:border-red-600'}`} />
          </div>
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 text-[#212121]">Telefono</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]" />
            <input type="tel" name="phone" placeholder="+54 9 1234 567890" value={form.phone}
              onChange={handleChange} disabled={loading} maxLength={30}
              className={`w-full pl-10 pr-3 py-2 border-2 rounded-lg focus:outline-none transition ${
                errors.phone ? 'border-red-600' : 'border-gray-300 focus:border-red-600'}`} />
          </div>
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full mt-4 bg-[#D9383A] text-white py-3 rounded-full font-bold hover:bg-[#b52d2f] disabled:bg-gray-400 active:scale-95 transition">
        {loading ? 'Procesando...' : 'Confirmar pedido'}
      </button>
    </form>
  );
}
