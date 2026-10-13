'use client';

import { useState, useEffect } from 'react';
import { fetchAdminCategories, createCategory, updateCategory, toggleCategoryActive, deleteCategory } from '@/services/admin.service';
import { Category } from '@/types';
import { IconPicker, getCategoryIcon } from './IconPicker';
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setCategories(await fetchAdminCategories()); } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => { setName(''); setIcon(''); setOrder(0); setEditingId(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, { name, icon, order });
        showMsg('Categoria actualizada');
      } else {
        await createCategory({ name, icon, order });
        showMsg('Categoria creada');
      }
      reset(); load();
    } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const edit = (c: Category) => { setName(c.name); setIcon(c.icon || ''); setOrder(c.order || 0); setEditingId(c._id || null); };
  const toggle = async (id: string | undefined) => { if (!id) return; try { await toggleCategoryActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string | undefined) => {
    if (!id || !confirm('Eliminar categoria?')) return;
    try { await deleteCategory(id); load(); showMsg('Categoria eliminada'); }
    catch (err: any) { showError(err.response?.data?.error || 'No se puede eliminar (tiene productos)'); }
  };

  if (loading) return <p className="text-[#757575] text-sm">Cargando categorias...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121]">Categorias del Menu</h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de categoria" required
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D9383A] text-sm" />
        <IconPicker value={icon} onChange={setIcon} />
        <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} placeholder="#"
          className="w-16 px-2 py-2 border-2 border-gray-300 rounded-lg text-sm" />
        <button type="submit" className="px-5 py-2 bg-[#D9383A] text-white rounded-lg font-bold hover:bg-[#b52d2f] text-sm flex items-center gap-1">
          <Plus size={14} /> {editingId ? 'Actualizar' : 'Crear'}
        </button>
        {editingId && <button type="button" onClick={reset} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>}
      </form>

      <div className="space-y-2">
        {categories.map((c) => {
          const Icon = getCategoryIcon(c.icon);
          return (
            <div key={c._id} className={`flex items-center gap-3 p-3 border-2 rounded-lg ${c.isActive !== false && (c as any).active !== false ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
              <Icon size={20} className="text-[#D9383A] flex-shrink-0" />
              <span className="font-bold text-sm text-[#212121] uppercase flex-1">{c.name}</span>
              <span className="text-xs text-[#757575]">#{c.order}</span>
              <div className="flex gap-1">
                <button onClick={() => toggle(c._id)} className={`p-1.5 rounded text-white text-xs ${(c as any).active !== false && c.isActive !== false ? 'bg-green-600' : 'bg-gray-400'}`}>
                  {(c as any).active !== false && c.isActive !== false ? <Power size={12} /> : <PowerOff size={12} />}
                </button>
                <button onClick={() => edit(c)} className="p-1.5 bg-blue-600 text-white rounded"><Pencil size={12} /></button>
                <button onClick={() => del(c._id)} className="p-1.5 bg-red-600 text-white rounded"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
