'use client';

import { useState, useEffect } from 'react';
import {
  fetchAdminOptionGroups, createOptionGroup, updateOptionGroup, toggleOptionGroupActive, deleteOptionGroup,
  fetchAdminOptions,
} from '@/services/admin.service';
import { formatCurrency } from '@/utils/format';
import { Plus, Pencil, Trash2, Power, PowerOff, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';

interface IncludedCfg {
  permiteCantidad: boolean;
  cantidadMaxima: number;
  precioEspecial: string;
}

const emptyCfg = (): IncludedCfg => ({ permiteCantidad: false, cantidadMaxima: 1, precioEspecial: '' });

export function OptionGroupsManager() {
  const [groups, setGroups] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'unico' | 'multiple'>('unico');
  const [obligatorio, setObligatorio] = useState(false);
  const [minimo, setMinimo] = useState(0);
  const [maximo, setMaximo] = useState(1);
  const [included, setIncluded] = useState<Record<string, IncludedCfg>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [g, o] = await Promise.all([fetchAdminOptionGroups(), fetchAdminOptions()]);
      setGroups(g as any[]);
      setOptions(o as any[]);
    } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => {
    setNombre(''); setDescripcion(''); setTipo('unico'); setObligatorio(false); setMinimo(0); setMaximo(1);
    setIncluded({}); setEditingId(null);
  };

  const toggleOptionIncluded = (optionId: string) => {
    setIncluded((prev) => {
      const next = { ...prev };
      if (next[optionId]) delete next[optionId];
      else next[optionId] = emptyCfg();
      return next;
    });
  };

  const updateCfg = (optionId: string, patch: Partial<IncludedCfg>) => {
    setIncluded((prev) => ({ ...prev, [optionId]: { ...prev[optionId], ...patch } }));
  };

  const changeTipo = (t: 'unico' | 'multiple') => {
    setTipo(t);
    if (t === 'unico') setMaximo(1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const optionIds = Object.keys(included);
    if (optionIds.length === 0) { showError('Agrega al menos una opción'); return; }
    const effectiveMax = tipo === 'unico' ? 1 : maximo;
    const effectiveMin = obligatorio ? Math.max(minimo, 1) : minimo;
    if (effectiveMax < effectiveMin) { showError('El máximo no puede ser menor que el mínimo'); return; }

    try {
      const payload = {
        nombre,
        descripcion,
        tipo,
        obligatorio,
        minimo: effectiveMin,
        maximo: effectiveMax,
        activo: true,
        ingredientes: optionIds.map((ingrediente, index) => {
          const cfg = included[ingrediente];
          return {
            ingrediente,
            orden: index,
            activo: true,
            permiteCantidad: cfg.permiteCantidad,
            cantidadMaxima: cfg.permiteCantidad ? Math.max(1, cfg.cantidadMaxima) : 1,
            precioEspecial: cfg.precioEspecial === '' ? null : Number(cfg.precioEspecial),
          };
        }),
      };
      if (editingId) {
        await updateOptionGroup(editingId, payload);
        showMsg('Grupo actualizado');
      } else {
        await createOptionGroup(payload);
        showMsg('Grupo creado');
      }
      reset(); load();
    } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const edit = (g: any) => {
    setNombre(g.nombre || '');
    setDescripcion(g.descripcion || '');
    setTipo(g.tipo || 'unico');
    setObligatorio(!!g.obligatorio);
    setMinimo(g.minimo ?? 0);
    setMaximo(g.maximo ?? 1);
    const inc: Record<string, IncludedCfg> = {};
    for (const go of g.ingredientes || []) {
      const optId = typeof go.ingrediente === 'object' ? go.ingrediente._id : go.ingrediente;
      inc[optId] = {
        permiteCantidad: !!go.permiteCantidad,
        cantidadMaxima: go.cantidadMaxima ?? 1,
        precioEspecial: go.precioEspecial != null ? String(go.precioEspecial) : '',
      };
    }
    setIncluded(inc);
    setEditingId(g._id);
  };

  const toggle = async (id: string) => { try { await toggleOptionGroupActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string) => {
    if (!confirm('Eliminar grupo?')) return;
    try { await deleteOptionGroup(id); load(); showMsg('Grupo eliminado'); } catch (err: any) { showError(err.response?.data?.error || 'Error'); }
  };

  const optionName = (id: string) => options.find((o) => o._id === id)?.nombre || id;

  if (loading) return <p className="text-[#757575] text-sm">Cargando grupos...</p>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><ListChecks size={18} /> Grupos de opciones</h2>
      <p className="text-xs text-[#757575] mb-3">Pasos reutilizables (bases, aderezos, toppings). Luego se asocian a cada producto.</p>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="font-semibold text-[#212121] flex items-center gap-2 text-sm">
            {editingId ? <Pencil size={14} /> : <Plus size={14} />} {editingId ? 'Editar grupo' : 'Nuevo grupo'}
          </h3>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Nombre del paso <Hint>El título que ve el cliente (ej: Elegí la base).</Hint>
            </label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Elegí la base" required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Descripción <Hint>Texto corto opcional debajo del título del paso.</Hint>
            </label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={2}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-[#D95A2B] focus:outline-none resize-none" />
          </div>

          <div className="flex flex-wrap gap-3 items-center text-sm">
            <label className="flex items-center gap-1">Tipo:
              <select value={tipo} onChange={(e) => changeTipo(e.target.value as any)} className="px-2 py-1 border-2 border-gray-300 rounded-lg text-sm">
                <option value="unico">Selección única</option>
                <option value="multiple">Selección múltiple</option>
              </select>
              <Hint>Única: el cliente elige 1 sola opción. Múltiple: puede elegir varias.</Hint>
            </label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={obligatorio} onChange={(e) => setObligatorio(e.target.checked)} className="accent-[#D95A2B]" /> Obligatorio
              <Hint>Si lo activás, el cliente no puede saltar este paso.</Hint>
            </label>
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-1 text-sm">Mín.
              <input type="number" value={minimo} min={0} onChange={(e) => setMinimo(Number(e.target.value))} className="w-20 px-2 py-1 border-2 border-gray-300 rounded-lg text-sm" />
              <Hint>Cantidad mínima que debe elegir el cliente.</Hint>
            </label>
            <label className="flex items-center gap-1 text-sm">Máx.
              <input type="number" value={tipo === 'unico' ? 1 : maximo} min={1} disabled={tipo === 'unico'} onChange={(e) => setMaximo(Number(e.target.value))} className="w-20 px-2 py-1 border-2 border-gray-300 rounded-lg text-sm disabled:bg-gray-100" />
              <Hint>Cantidad máxima que puede elegir. En selección única siempre es 1.</Hint>
            </label>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
              Opciones del paso <Hint>Tildá los ingredientes que pertenecen a este paso.</Hint>
            </label>
            <div className="space-y-2 max-h-[240px] overflow-y-auto p-2 border rounded-lg">
              {options.length === 0 && <p className="text-[11px] text-[#757575]">Primero crea ingredientes.</p>}
              {options.map((o: any) => {
                const isIn = !!included[o._id];
                const cfg = included[o._id];
                return (
                  <div key={o._id} className={`rounded-lg border p-2 ${isIn ? 'border-[#D95A2B] bg-[#F2EEE9]' : 'border-gray-200'}`}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={isIn} onChange={() => toggleOptionIncluded(o._id)} className="accent-[#D95A2B]" />
                      <span className="font-medium text-[#212121]">{o.nombre}</span>
                      <span className="text-[10px] text-[#757575]">{formatCurrency(o.precio)}</span>
                    </label>
                    {isIn && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 pl-6 text-[11px] text-[#212121]">
                        <label className="flex items-center gap-1"><input type="checkbox" checked={cfg.permiteCantidad} onChange={(e) => updateCfg(o._id, { permiteCantidad: e.target.checked })} className="accent-[#D95A2B]" /> Cantidad
                          <Hint>Permite elegir varias unidades de este ingrediente.</Hint>
                        </label>
                        {cfg.permiteCantidad && (
                          <label className="flex items-center gap-1">Máx.
                            <input type="number" value={cfg.cantidadMaxima} min={1} onChange={(e) => updateCfg(o._id, { cantidadMaxima: Number(e.target.value) })} className="w-14 px-1 py-0.5 border rounded" />
                            <Hint>Máximo de unidades que puede pedir de este ingrediente.</Hint>
                          </label>
                        )}
                        <label className="flex items-center gap-1">Precio Especial
                          <input type="number" value={cfg.precioEspecial} min={0} step="0.01" placeholder="auto" onChange={(e) => updateCfg(o._id, { precioEspecial: e.target.value })} className="w-20 px-1 py-0.5 border rounded" />
                          <Hint>Precio distinto solo en este paso. Vacío = usa el precio del ingrediente.</Hint>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-6 py-2 bg-[#D95A2B] text-white rounded-lg font-bold hover:bg-[#D94B2B] text-sm">
              {editingId ? 'Actualizar' : 'Crear grupo'}
            </button>
            {editingId && <button type="button" onClick={reset} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>}
          </div>
        </form>

        <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
          {groups.length === 0 && <p className="text-[#757575] text-sm">No hay grupos</p>}
          {groups.map((g: any) => (
            <div key={g._id} className={`p-3 border-2 rounded-lg ${g.activo !== false ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#212121]">{g.nombre}</p>
                  <p className="text-[10px] text-[#757575]">
                    {g.tipo === 'unico' ? 'Única' : 'Múltiple'} · {g.obligatorio ? 'Obligatorio' : 'Opcional'} · min {g.minimo}/max {g.maximo}
                  </p>
                  <p className="text-[10px] text-[#757575] mt-0.5">{(g.ingredientes || []).map((go: any) => (typeof go.ingrediente === 'object' ? go.ingrediente.nombre : optionName(go.ingrediente))).join(', ')}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggle(g._id)} className={`p-1 rounded text-white text-xs ${g.activo !== false ? 'bg-green-600' : 'bg-gray-400'}`}>
                    {g.activo !== false ? <Power size={11} /> : <PowerOff size={11} />}
                  </button>
                  <button onClick={() => edit(g)} className="p-1 bg-blue-600 text-white rounded"><Pencil size={11} /></button>
                  <button onClick={() => del(g._id)} className="p-1 bg-red-600 text-white rounded"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
