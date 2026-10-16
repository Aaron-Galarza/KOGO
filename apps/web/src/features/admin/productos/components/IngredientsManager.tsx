'use client';

import { useState, useEffect } from 'react';
import { fetchAdminOptions, createOption, updateOption, toggleOptionActive, deleteOption } from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, Power, PowerOff, Carrot } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';

export function IngredientsManager() {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [orden, setOrden] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setOptions((await fetchAdminOptions()) as any[]);
    } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => { setNombre(''); setPrecio(''); setDescripcion(''); setDisponible(true); setOrden(0); setEditingId(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { nombre, precio: parseFloat(precio), descripcion, disponible, orden };
      if (editingId) {
        await updateOption(editingId, payload);
        showMsg('Ingrediente actualizado');
      } else {
        await createOption(payload);
        showMsg('Ingrediente creado');
      }
      reset(); load();
    } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const edit = (o: any) => {
    setNombre(o.nombre || '');
    setPrecio(String(o.precio ?? 0));
    setDescripcion(o.descripcion || '');
    setDisponible(o.disponible !== false);
    setOrden(o.orden ?? 0);
    setEditingId(o._id);
  };

  const toggle = async (id: string) => { try { await toggleOptionActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string) => {
    if (!confirm('Eliminar ingrediente?')) return;
    try { await deleteOption(id); load(); showMsg('Ingrediente eliminado'); } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <p className="text-[#757575] text-sm">Cargando ingredientes...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Carrot size={18} /> Ingredientes / Opciones</h2>
      <p className="text-xs text-[#757575] mb-3">Opciones reutilizables que se combinan en grupos (bases, aderezos, toppings, etc.).</p>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold text-[#212121] flex items-center gap-2 text-sm">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />} {editingId ? 'Editar ingrediente' : 'Nuevo ingrediente'}
          </h3>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Nombre <Hint>Cómo se muestra al cliente (ej: Mayonesa).</Hint>
            </label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mayonesa" required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Precio / suplemento <Hint>Lo que suma al producto. Poné 0 si es sin cargo.</Hint>
            </label>
            <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 500" required min={0} step="0.01"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Descripción <Hint>Texto corto opcional que aclara qué es.</Hint>
            </label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={2}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none resize-none" />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-[#212121]">
              <input type="checkbox" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} className="accent-[#D95A2B]" /> Disponible
              <Hint>Si lo sacás, aparece en la carta pero no se puede elegir.</Hint>
            </label>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
                Orden <Hint>Número para acomodarlo dentro de la lista (menor = primero).</Hint>
              </label>
              <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} min={0}
                className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-[#D95A2B] text-white rounded-lg font-bold hover:bg-[#D94B2B] text-sm">
              {editingId ? 'Actualizar' : 'Crear ingrediente'}
            </button>
            {editingId && <button type="button" onClick={reset} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>}
          </div>
        </form>

        <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
          {options.length === 0 && <p className="text-[#757575] text-sm">No hay ingredientes</p>}
          {options.map((o: any) => (
            <div key={o._id} className={`flex items-center justify-between p-3 border-2 rounded-lg ${o.activo !== false ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-[#212121] truncate">
                  {o.nombre} - {formatCurrency(o.precio)}
                  {o.disponible === false && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">No disponible</span>}
                </p>
                <p className="text-[10px] text-[#757575]">Orden {o.orden ?? 0}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => toggle(o._id)} className={`p-1 rounded text-white text-xs ${o.activo !== false ? 'bg-green-600' : 'bg-gray-400'}`}>
                  {o.activo !== false ? <Power size={11} /> : <PowerOff size={11} />}
                </button>
                <button onClick={() => edit(o)} className="p-1 bg-blue-600 text-white rounded"><Pencil size={11} /></button>
                <button onClick={() => del(o._id)} className="p-1 bg-red-600 text-white rounded"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
