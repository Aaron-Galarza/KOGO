'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAdminCategories, fetchAdminProducts, fetchAdminOptionGroups, createProduct, updateProduct, toggleProductActive, deleteProduct, uploadGalleryImage } from '@/services/admin.service';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, Power, PowerOff, Package, Upload } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';
import { PRODUCT_IMAGE, describeLimits, validateImageFile } from '@/utils/image';

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionGroups, setOptionGroups] = useState<any[]>([]);
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
  const [tipoProducto, setTipoProducto] = useState<'simple' | 'configurable'>('simple');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const problem = await validateImageFile(file, PRODUCT_IMAGE);
      if (problem) {
        showError(problem);
        if (fileRef.current) fileRef.current.value = '';
        return;
      }
      const fd = new FormData();
      fd.append('image', file);
      fd.append('title', title || file.name);
      fd.append('purpose', 'product');
      const uploaded = await uploadGalleryImage(fd);
      setImage(uploaded.url);
      showMsg('Foto lista: ya quedó cargada y optimizada');
    } catch (err: any) {
      showError(err.response?.data?.error || err.message || 'Error al subir la foto');
    }
    setUploading(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [p, c, g] = await Promise.all([fetchAdminProducts(), fetchAdminCategories(), fetchAdminOptionGroups()]);
      setProducts(p);
      setCategories(c);
      setOptionGroups(g as any[]);
    } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => {
    setTitle(''); setPrice(''); setDescription(''); setImage(''); setCategoryId(''); setStock(0); setControlStock(false);
    setTipoProducto('simple'); setGroupIds([]); setEditingId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const toggleGroup = (id: string) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { showError('Selecciona una categoria'); return; }
    if (image && /\.gif(\?|#|$)/i.test(image)) { showError('Los GIF solo se permiten en el banner. Usá una imagen JPG, PNG o WEBP.'); return; }
    try {
      const payload: Record<string, any> = {
        title, price: parseFloat(price), description, image, category: categoryId, active: true, controlStock, stock, tipoProducto,
      };
      if (tipoProducto === 'configurable') {
        payload.gruposOpciones = groupIds.map((gid, i) => ({ grupo: gid, orden: i }));
      } else {
        payload.gruposOpciones = [];
      }
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
    setTipoProducto((p.tipoProducto as 'simple' | 'configurable') || 'simple');
    setGroupIds(((p as any).gruposOpciones || []).map((a: any) => (typeof a.grupo === 'object' ? a.grupo._id : a.grupo)));
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

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Nombre del producto <Hint>Es el nombre que ve el cliente en el menú.</Hint>
            </label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Kogo Clásico" required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Precio base <Hint>Precio sin contar los ingredientes que el cliente agregue.</Hint>
            </label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 7799" required min={1} step="0.01"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Descripción <Hint>Texto corto que aparece debajo del nombre.</Hint>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)" rows={2}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none resize-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Foto del producto <Hint>Subila desde tu equipo o pegá el link (URL). {describeLimits(PRODUCT_IMAGE)} Los GIF no se permiten en productos, solo en el banner.</Hint>
            </label>
            <div className="flex flex-col gap-2">
              <input type="file" ref={fileRef} onChange={handleImageFile} accept={PRODUCT_IMAGE.accept} disabled={uploading} title="Subir foto del producto"
                className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-[#D95A2B]" />
              <div className="flex items-center gap-2">
                <Upload size={14} className="shrink-0 text-[#757575]" />
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
              </div>
              {uploading && <span className="text-xs text-[#757575]">Subiendo y optimizando...</span>}
              {image && (
                <div className="aspect-[6/5] w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img src={image} alt="Vista previa" className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Categoría <Hint>Sección del menú donde aparece el producto.</Hint>
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none">
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#212121]">
            <input type="checkbox" checked={controlStock} onChange={(e) => setControlStock(e.target.checked)} className="accent-[#D95A2B]" /> Controlar stock
            <Hint>Si lo activás, se descuenta con cada venta y se bloquea al llegar a 0.</Hint>
          </label>
          {controlStock && (
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
                Unidades disponibles <Hint>Cantidad que se puede vender ahora.</Hint>
              </label>
              <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} placeholder="Stock disponible" min={0}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
            </div>
          )}

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Tipo de producto <Hint>Simple: se agrega directo. Configurable: el cliente elige ingredientes antes de agregarlo.</Hint>
            </label>
            <select value={tipoProducto} onChange={(e) => setTipoProducto(e.target.value as 'simple' | 'configurable')}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none">
              <option value="simple">Simple (sin pasos)</option>
              <option value="configurable">Configurable (con pasos)</option>
            </select>
          </div>

          {tipoProducto === 'configurable' && (
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
                Pasos que debe completar <Hint>El cliente los ve en un asistente. El número indica el orden: se arma según el orden en que tocás cada uno.</Hint>
              </label>
              <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto p-2 border rounded-lg">
                {optionGroups.length === 0 && <p className="text-[11px] text-[#757575]">No hay grupos creados.</p>}
                {optionGroups.map((g: any) => (
                  <button type="button" key={g._id} onClick={() => toggleGroup(g._id)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                      groupIds.includes(g._id) ? 'bg-[#D95A2B] text-white' : 'bg-gray-100 text-[#757575] hover:bg-gray-200'
                    }`}>
                    {g.nombre}{groupIds.includes(g._id) ? ` (${groupIds.indexOf(g._id) + 1})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-[#D95A2B] text-white rounded-lg font-bold hover:bg-[#D94B2B] text-sm">
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
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:border-[#D95A2B] focus:outline-none">
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
                    {p.tipoProducto === 'configurable' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-[#F2EEE9] text-[#D95A2B]">Con pasos</span>
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
