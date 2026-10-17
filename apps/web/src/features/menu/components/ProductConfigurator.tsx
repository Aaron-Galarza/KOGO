'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, ConfiguracionProducto, GrupoConfigurable, OpcionElegida } from '@/types';
import { menuService } from '@/services/menu.service';
import { formatCurrency } from '@/utils/format';

interface ProductConfiguratorProps {
  product: Product;
  onConfirm: (product: Product, ingredientes: OpcionElegida[]) => void;
  onClose: () => void;
  offsetForHeader?: boolean;
  /** Opciones ya elegidas (al editar un ítem que ya está en el carrito). */
  initialIngredientes?: OpcionElegida[];
}

type Selection = Record<string, Record<string, number>>;

/**
 * Solo se confía en la configuración guardada en el producto si realmente trae
 * opciones. Un carrito persistido puede tener una copia vieja o vacía: en ese
 * caso conviene volver a pedir el detalle para no mostrar grupos sin opciones.
 */
function hasUsableGroups(config?: ConfiguracionProducto | null): boolean {
  return !!config && Array.isArray(config.grupos) && config.grupos.some((g) => (g.ingredientes?.length ?? 0) > 0);
}

/** Convierte los ingredientes ya elegidos en el mapa de selección del modal. */
function buildSelection(ingredientes?: OpcionElegida[]): Selection {
  const selection: Selection = {};
  for (const ing of ingredientes ?? []) {
    if (!ing?.grupoId || !ing?.ingredienteId) continue;
    selection[ing.grupoId] = {
      ...(selection[ing.grupoId] ?? {}),
      [ing.ingredienteId]: ing.cantidad > 0 ? ing.cantidad : 1,
    };
  }
  return selection;
}

interface Validated {
  valid: boolean;
  message: string | null;
  ingredientes: OpcionElegida[];
  precioIngredientes: number;
}

function validate(groups: GrupoConfigurable[], selection: Selection): Validated {
  const ingredientes: OpcionElegida[] = [];
  let precioIngredientes = 0;

  for (const group of groups) {
    const chosen = group.ingredientes.filter((o) => (selection[group.grupoId]?.[o.ingredienteId] ?? 0) > 0);

    if (group.obligatorio && chosen.length === 0) {
      return { valid: false, message: `Elegí una opción en "${group.nombre}".`, ingredientes, precioIngredientes };
    }
    if (group.tipo === 'unico' && chosen.length > 1) {
      return { valid: false, message: `Solo una opción en "${group.nombre}".`, ingredientes, precioIngredientes };
    }
    if (chosen.length < (group.minimo || 0)) {
      return {
        valid: false,
        message: `Elegí al menos ${group.minimo} en "${group.nombre}".`,
        ingredientes,
        precioIngredientes,
      };
    }
    if (group.maximo > 0 && chosen.length > group.maximo) {
      return {
        valid: false,
        message: `Máximo ${group.maximo} en "${group.nombre}".`,
        ingredientes,
        precioIngredientes,
      };
    }

    for (const option of chosen) {
      const cantidad = selection[group.grupoId][option.ingredienteId];
      precioIngredientes += option.precio * cantidad;
      ingredientes.push({
        grupoId: group.grupoId,
        grupoNombre: group.nombre,
        ingredienteId: option.ingredienteId,
        ingredienteNombre: option.nombre,
        precio: option.precio,
        cantidad,
      });
    }
  }

  return { valid: true, message: null, ingredientes, precioIngredientes };
}

export function ProductConfigurator({ product, onConfirm, onClose, offsetForHeader = true, initialIngredientes }: ProductConfiguratorProps) {
  // Si el producto ya trae una configuración usable se muestra al instante; si
  // no (o viene vacía), se pide el detalle a la API.
  const productHasConfig = hasUsableGroups(product.configuracion);
  const [configuracion, setConfiguracion] = useState<ConfiguracionProducto | null>(
    productHasConfig ? product.configuracion! : null
  );
  const [loading, setLoading] = useState(!productHasConfig);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(() => buildSelection(initialIngredientes));

  useEffect(() => {
    // Si ya hay configuración usable no hace falta pedir nada; el ítem se monta
    // con `key` por producto, así que no hay que resetear estado (loading ya
    // arranca en true cuando esta rama se ejecuta).
    if (productHasConfig) return;
    let alive = true;
    menuService
      .getProductDetail(String(product._id))
      .then((detail) => {
        if (!alive) return;
        setConfiguracion(detail?.configuracion ?? { productoId: String(product._id), tipoProducto: 'simple', grupos: [] });
      })
      .catch(() => {
        if (alive) setError('No pudimos cargar las opciones del producto.');
      })
      .finally(() => {
        // El spinner se apaga siempre: si el pedido falla o la configuración
        // viene vacía, el modal no queda bloqueado en "Cargando opciones…".
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [product._id, productHasConfig]);

  const groups = useMemo(() => configuracion?.grupos ?? [], [configuracion]);
  const validation = useMemo(() => validate(groups, selection), [groups, selection]);

  const isSelected = (grupoId: string, ingredienteId: string) => (selection[grupoId]?.[ingredienteId] ?? 0) > 0;
  const chosenCount = (grupoId: string) => Object.values(selection[grupoId] ?? {}).filter((q) => q > 0).length;

  const selectSingle = (group: GrupoConfigurable, ingredienteId: string) => {
    setSelection((prev) => ({ ...prev, [group.grupoId]: { [ingredienteId]: 1 } }));
  };

  const toggleMultiple = (group: GrupoConfigurable, ingredienteId: string, permiteCantidad: boolean, cantidadMaxima: number) => {
    setSelection((prev) => {
      const current = { ...(prev[group.grupoId] ?? {}) };
      const qty = current[ingredienteId] ?? 0;

      if (permiteCantidad) {
        if (qty === 0) {
          if (group.maximo > 0 && chosenCount(group.grupoId) >= group.maximo) return prev;
          current[ingredienteId] = 1;
        } else if (qty >= cantidadMaxima) {
          return prev;
        } else {
          current[ingredienteId] = qty + 1;
        }
        return { ...prev, [group.grupoId]: current };
      }

      if (qty > 0) {
        delete current[ingredienteId];
      } else {
        if (group.maximo > 0 && chosenCount(group.grupoId) >= group.maximo) return prev;
        current[ingredienteId] = 1;
      }
      return { ...prev, [group.grupoId]: current };
    });
  };

  const decrement = (grupoId: string, ingredienteId: string) => {
    setSelection((prev) => {
      const current = { ...(prev[grupoId] ?? {}) };
      const qty = current[ingredienteId] ?? 0;
      if (qty <= 1) delete current[ingredienteId];
      else current[ingredienteId] = qty - 1;
      return { ...prev, [grupoId]: current };
    });
  };

  const itemTotal = product.price + validation.precioIngredientes;
  const title = product.title || product.name;

  const handleConfirm = () => {
    if (!validation.valid) return;
    onConfirm(product, validation.ingredientes);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 md:items-center md:px-4 md:pb-4 ${offsetForHeader ? 'pt-[70px] md:pt-[100px]' : ''}`}>
      <div className={`flex w-full flex-col overflow-hidden rounded-t-3xl bg-white md:max-w-lg md:rounded-2xl ${offsetForHeader ? 'max-h-[calc(100dvh-70px)] md:max-h-[calc(100dvh-120px)]' : 'max-h-[92dvh] md:max-h-[90vh]'}`}>
        <div className="flex flex-shrink-0 items-center justify-between rounded-t-3xl border-b border-gray-200 p-4 md:rounded-t-2xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D95A2B]">Personalizá tu pedido</p>
            <h2 className="font-[var(--font-montserrat)] text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-400 transition hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-500">Cargando opciones…</div>
          ) : error ? (
            <div className="flex h-40 items-center justify-center text-center text-sm text-red-600">{error}</div>
          ) : groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Este producto no tiene opciones.</p>
          ) : (
            groups.map((group, index) => (
              <div key={group.grupoId} className="mb-6 last:mb-2">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <h3 className="font-[var(--font-montserrat)] text-sm font-bold text-gray-900">
                    <span className="text-[#D95A2B]">{index + 1}.</span> {group.nombre}
                  </h3>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${group.obligatorio ? 'text-[#D95A2B]' : 'text-gray-400'}`}>
                    {group.tipo === 'unico' ? 'Elegí 1' : `Elegí ${group.minimo}${group.maximo === group.minimo ? '' : ` a ${group.maximo}`}`}
                    {group.obligatorio ? ' · obligatorio' : ''}
                  </span>
                </div>
                {group.descripcion && <p className="mb-2 text-xs text-gray-500">{group.descripcion}</p>}

                <div className="space-y-2">
                  {group.ingredientes.map((option) => {
                    const active = isSelected(group.grupoId, option.ingredienteId);
                    const qty = selection[group.grupoId]?.[option.ingredienteId] ?? 0;
                    return (
                      <div
                        key={option.ingredienteId}
                        className={`flex items-center justify-between rounded-xl border-2 p-3 transition ${
                          active ? 'border-[#D95A2B] bg-[#F2EEE9]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            group.tipo === 'unico'
                              ? selectSingle(group, option.ingredienteId)
                              : toggleMultiple(group, option.ingredienteId, option.permiteCantidad, option.cantidadMaxima)
                          }
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                              group.tipo === 'unico' ? 'rounded-full' : 'rounded-md'
                            } ${active ? 'border-[#D95A2B] bg-[#D95A2B] text-white' : 'border-gray-300'}`}
                          >
                            {active && <Check size={12} />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">{option.nombre}</span>
                            {option.precio > 0 && (
                              <span className="block text-xs font-medium text-[#D95A2B]">
                                + {formatCurrency(option.precio)}
                              </span>
                            )}
                          </span>
                        </button>

                        {option.permiteCantidad && active && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => decrement(group.grupoId, option.ingredienteId)}
                              aria-label="Quitar uno"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-[#D95A2B] hover:text-[#D95A2B]"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => toggleMultiple(group, option.ingredienteId, true, option.cantidadMaxima)}
                              disabled={qty >= option.cantidadMaxima}
                              aria-label="Agregar uno"
                              className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                qty >= option.cantidadMaxima
                                  ? 'cursor-not-allowed border-gray-200 text-gray-300'
                                  : 'border-gray-300 text-gray-600 hover:border-[#D95A2B] hover:text-[#D95A2B]'
                              }`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {validation.message && <p className="mb-2 text-center text-xs font-medium text-red-600">{validation.message}</p>}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="font-[var(--font-montserrat)] text-lg font-bold text-[#D95A2B]">
              {formatCurrency(itemTotal)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!validation.valid}
            className={`w-full rounded-full py-3 font-bold text-white transition ${
              validation.valid ? 'bg-[#D95A2B] hover:bg-[#D94B2B] active:scale-[0.98]' : 'cursor-not-allowed bg-gray-300'
            }`}
          >
            Agregar al carrito · {formatCurrency(itemTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
