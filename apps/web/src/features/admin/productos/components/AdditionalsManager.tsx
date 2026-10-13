'use client';

import { useState, useEffect } from 'react';
import { menuService } from '@/services/menu.service';
import { fetchAdminAddons, createAddon, updateAddon, toggleAddonActive, deleteAddon, fetchAdminCategories } from '@/services/admin.service';
import { Addon, Category } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, Power, PowerOff, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function AdditionalsManager() {
  const [additionals, setAdditionals] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        fetchAdminAddons(),
        fetchAdminCategories(),
      ]);
      setAdditionals(a as Addon[]);
      setCategories(c);
    } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => { setTitle(''); setPrice(''); setSelectedCats([]); setEditingId(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, price: parseFloat(price), categories: selectedCats };
      if (editingId) {
        await updateAddon(editingId, payload);
        showMsg('Adicional actualizado');
      } else {
        await createAddon(payload);
        showMsg('Adicional creado');
      }
      reset(); load();
    } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const edit = (a: any) => {
    setTitle(a.title);
    setPrice(String(a.price));
    setSelectedCats(a.categories || []);
    setEditingId(a._id);
  };

  const toggle = async (id: string) => { try { await toggleAddonActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string) => {
    if (!confirm('Eliminar adicional?')) return;
    try { await deleteAddon(id); load(); showMsg('Adicional eliminado'); } catch { showError('Error'); }
  };

  const toggleCat = (catId: string) => {
    setSelectedCats((prev) => prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]);
  };

  const getCatNames = (catIds: string[]) => {
    return catIds.map((id) => categories.find((c) => c._id === id)?.name || '').filter(Boolean).join(', ') || 'Todos';
  };

  if (loading) return <p className="text-[#757575] text-sm">Cargando adicionales...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Package size={18} /> Adicionales</h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold text-[#212121] flex items-center gap-2 text-sm">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />} {editingId ? 'Editar adicional' : 'Nuevo adicional'}
          </h3>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre (ej: Cheddar Extra)" required
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio" required min={1} step="0.01"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />

          <div>
            <label className="block text-xs font-semibold mb-1 text-[#212121]">Categorias asociadas (vacio = todas)</label>
            <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-2 border rounded-lg">
              {categories.map((c) => (
                <button type="button" key={c._id} onClick={() => toggleCat(c._id!)}
                  className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                    selectedCats.includes(c._id!) ? 'bg-[#D9383A] text-white' : 'bg-gray-100 text-[#757575] hover:bg-gray-200'
                  }`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-[#D9383A] text-white rounded-lg font-bold hover:bg-[#b52d2f] text-sm">
              {editingId ? 'Actualizar' : 'Crear adicional'}
            </button>
            {editingId && <button type="button" onClick={reset} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>}
          </div>
        </form>

        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
          {additionals.length === 0 && <p className="text-[#757575] text-sm">No hay adicionales</p>}
          {additionals.map((a: any) => (
            <div key={a._id} className={`flex items-center justify-between p-3 border-2 rounded-lg ${a.active !== false ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-[#212121] truncate">{a.title} - {formatCurrency(a.price)}</p>
                <p className="text-[10px] text-[#757575]">{getCatNames(a.categories || [])}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => toggle(a._id)} className={`p-1 rounded text-white text-xs ${a.active !== false ? 'bg-green-600' : 'bg-gray-400'}`}>
                  {a.active !== false ? <Power size={11} /> : <PowerOff size={11} />}
                </button>
                <button onClick={() => edit(a)} className="p-1 bg-blue-600 text-white rounded"><Pencil size={11} /></button>
                <button onClick={() => del(a._id)} className="p-1 bg-red-600 text-white rounded"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
