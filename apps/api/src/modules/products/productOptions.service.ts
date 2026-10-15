import { AppError } from '../../utils/appError';
import { ResolvedConfiguration } from './productConfig.resolver';

export interface SelectedOptionInput {
  grupoId: string;
  ingredienteId: string;
  cantidad?: number;
}

export interface PricedOption {
  grupoId: string;
  grupoNombre: string;
  ingredienteId: string;
  ingredienteNombre: string;
  precio: number;
  cantidad: number;
}

export interface ConfigurationResult {
  ingredientes: PricedOption[];
  precioIngredientes: number;
}

// Valida la configuración elegida por el cliente contra la configuración resuelta
// del producto y devuelve el snapshot con precios calculados en el servidor.
// Nunca confía en los precios que envía el frontend.
export function validateProductConfiguration(
  config: ResolvedConfiguration,
  selections: SelectedOptionInput[] = []
): ConfigurationResult {
  const groupById = new Map(config.grupos.map((g) => [g.grupoId, g]));

  for (const sel of selections) {
    if (!groupById.has(sel.grupoId)) {
      throw new AppError('La configuración del producto es inválida', 400);
    }
  }

  const ingredientes: PricedOption[] = [];
  let precioIngredientes = 0;

  for (const group of config.grupos) {
    const entries = selections.filter((s) => s.grupoId === group.grupoId);

    if (group.obligatorio && entries.length === 0) {
      throw new AppError(`Debes elegir una opción en "${group.nombre}"`, 400);
    }
    if (group.tipo === 'unico' && entries.length > 1) {
      throw new AppError(`Solo puedes elegir una opción en "${group.nombre}"`, 400);
    }
    if (entries.length < (group.minimo || 0)) {
      throw new AppError(`Debes elegir al menos ${group.minimo} opción(es) en "${group.nombre}"`, 400);
    }
    if (group.maximo > 0 && entries.length > group.maximo) {
      throw new AppError(`Puedes elegir como máximo ${group.maximo} opción(es) en "${group.nombre}"`, 400);
    }

    for (const entry of entries) {
      const option = group.ingredientes.find((o) => o.ingredienteId === entry.ingredienteId);
      if (!option) {
        throw new AppError(`El ingrediente elegido en "${group.nombre}" no está disponible`, 400);
      }

      let cantidad = 1;
      const requested = entry.cantidad ?? 1;
      if (option.permiteCantidad) {
        if (!Number.isInteger(requested) || requested < 1) {
          throw new AppError(`Cantidad inválida en "${group.nombre}"`, 400);
        }
        if (requested > option.cantidadMaxima) {
          throw new AppError(`Puedes elegir hasta ${option.cantidadMaxima} de "${option.nombre}"`, 400);
        }
        cantidad = requested;
      } else if (requested !== 1) {
        throw new AppError(`"${option.nombre}" no admite cantidad`, 400);
      }

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

  return { ingredientes, precioIngredientes };
}
