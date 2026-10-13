'use client';

import { useState, useEffect } from 'react';
import { fetchAdminCategories, fetchAdminProducts, createProduct, updateProduct, toggleProductActive, deleteProduct } from '@/services/admin.service';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, Power, PowerOff, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();
  const [filterCat, setFilterCat] = useState('');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState(0);
  const [controlStock, setControlStock] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchAdminProducts(), fetchAdminCategories()]);
      setProducts(p);
      setCategories(c);
    } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => {
    setTitle(''); setPrice(''); setDescription(''); setImage(''); setCategoryId(''); setStock(0); setControlStock(false); setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { showError('Selecciona una categoria'); return; }
    try {
      const payload = { title, price: parseFloat(price), description, image, category: categoryId, active: true, controlStock, stock };
      if (editingId) {
        await updateProduct(editingId, payload);
        showMsg('Producto actualizado');
      } else {
        await createProduct(payload);
        showMsg('Producto creado');
      }
      reset(); load();
    } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const edit = (p: Product) => {
    setTitle(p.title || p.name);
    setPrice(String(p.price));
    setDescription(p.description || '');
    setImage(p.image || p.imageUrl || '');
    setCategoryId(typeof p.category === 'object' ? (p.category as any)._id : String(p.category));
    setStock(p.controlStock === true ? (p.stock ?? 0) : 0);
    setControlStock(p.controlStock === true);
    setEditingId(p._id);
  };

  const toggle = async (id: string) => { try { await toggleProductActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string) => {
    if (!confirm('Eliminar producto?')) return;
    try { await deleteProduct(id); load(); showMsg('Producto eliminado'); } catch { showError('Error'); }
  };

  const filtered = filterCat ? products.filter((p) => {
    const cid = typeof p.category === 'object' ? (p.category as any)._id : String(p.category);
    return cid === filterCat;
  }) : products;

  const getCatName = (p: Product) => {
    if (typeof p.category === 'object' && p.category) return (p.category as any).name || '';
    const cat = categories.find((c) => c._id === p.category);
    return cat?.name || '';
  };

  if (loading) return <p className="text-[#757575] text-sm">Cargando productos...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Package size={18} /> Productos</h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario - izquierda */}
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold text-[#212121] flex items-center gap-2 text-sm">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />} {editingId ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" required
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio" required min={1} step="0.01"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion" rows={2}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none resize-none" />
          <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL de imagen (opcional)"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none">
            <option value="">Seleccionar categoria</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-[#212121]">
            <input type="checkbox" checked={controlStock} onChange={(e) => setControlStock(e.target.checked)} className="accent-[#D9383A]" /> Controlar stock
          </label>
          {controlStock && (
            <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} placeholder="Stock disponible" min={0}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D9383A] focus:outline-none" />
          )}
          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-[#D9383A] text-white rounded-lg font-bold hover:bg-[#b52d2f] text-sm">
              {editingId ? 'Actualizar' : 'Crear producto'}
            </button>
            {editingId && <button type="button" onClick={reset} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>}
          </div>
        </form>

        {/* Lista de productos - derecha */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-[#212121]">Tus Productos</h3>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:border-[#D9383A] focus:outline-none">
              <option value="">Todas las categorias</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
            {filtered.length === 0 && <p className="text-[#757575] text-sm">No hay productos</p>}
            {filtered.map((p) => (
              <div key={p._id} className={`flex items-center gap-3 p-3 border-2 rounded-lg ${(p as any).active !== false && p.isActive !== false ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
                {p.image && <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"><img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs text-[#212121] truncate">{p.title || p.name}</p>
                    {(p as any).controlStock === true && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${((p as any).stock ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        Stock: {(p as any).stock ?? 0}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#757575]">{getCatName(p)} · {formatCurrency(p.price)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggle(p._id)} className={`p-1 rounded text-white text-xs ${(p as any).active !== false && p.isActive !== false ? 'bg-green-600' : 'bg-gray-400'}`}>
                    {(p as any).active !== false && p.isActive !== false ? <Power size={11} /> : <PowerOff size={11} />}
                  </button>
                  <button onClick={() => edit(p)} className="p-1 bg-blue-600 text-white rounded"><Pencil size={11} /></button>
                  <button onClick={() => del(p._id)} className="p-1 bg-red-600 text-white rounded"><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
