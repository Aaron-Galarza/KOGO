import { IProduct } from './products.model';
import { IGrupoOpciones } from '../option-groups/optionGroups.model';
import { IOpcion } from '../options/options.model';
import { OptionGroupType } from '../../constants';

export interface ResolvedOption {
  ingredienteId: string;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: number;
  permiteCantidad: boolean;
  cantidadMaxima: number;
  orden: number;
}

export interface ResolvedGroup {
  grupoId: string;
  nombre: string;
  descripcion?: string;
  tipo: OptionGroupType;
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  orden: number;
  ingredientes: ResolvedOption[];
}

export interface ResolvedConfiguration {
  productoId: string;
  tipoProducto: string;
  grupos: ResolvedGroup[];
}

// Combina los grupos reutilizables con la configuración específica del producto
// (orden de pasos, mínimos/máximos y subconjunto de ingredientes habilitados).
// La configuración del producto tiene prioridad sobre los valores del grupo.
export function resolveProductConfiguration(product: IProduct): ResolvedConfiguration {
  const grupos: ResolvedGroup[] = [];

  for (const assoc of product.gruposOpciones || []) {
    const group = assoc.grupo as unknown as IGrupoOpciones;
    if (!group || typeof group === 'string' || !group.activo) continue;

    const enabledIds = (assoc.ingredientes || []).map((o) => String(o));
    const ingredientes: ResolvedOption[] = [];

    for (const go of group.ingredientes || []) {
      const ing = go.ingrediente as unknown as IOpcion;
      if (!ing || typeof ing === 'string') continue;
      if (!ing.activo || !ing.disponible) continue;
      if (go.activo === false) continue;
      if (enabledIds.length > 0 && !enabledIds.includes(String(ing._id))) continue;

      ingredientes.push({
        ingredienteId: String(ing._id),
        nombre: ing.nombre,
        descripcion: ing.descripcion,
        imagen: ing.imagen,
        precio: go.precioEspecial != null ? go.precioEspecial : ing.precio,
        permiteCantidad: !!go.permiteCantidad,
        cantidadMaxima: go.cantidadMaxima ?? 1,
        orden: go.orden ?? 0,
      });
    }

    if (ingredientes.length === 0) continue;
    ingredientes.sort((a, b) => a.orden - b.orden);

    grupos.push({
      grupoId: String(group._id),
      nombre: group.nombre,
      descripcion: group.descripcion,
      tipo: group.tipo,
      obligatorio: assoc.obligatorio ?? group.obligatorio,
      minimo: assoc.minimo ?? group.minimo,
      maximo: assoc.maximo ?? group.maximo,
      orden: assoc.orden ?? 0,
      ingredientes,
    });
  }

  grupos.sort((a, b) => a.orden - b.orden);

  return {
    productoId: String(product._id),
    tipoProducto: product.tipoProducto,
    grupos,
  };
}
