import { IProduct } from './products.model';
import { AppError } from '../../utils/appError';

export interface SelectedOptionInput {
  groupId: string;
  optionId: string;
  quantity?: number;
}

export interface PricedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
  quantity: number;
}

export interface ConfigurationResult {
  options: PricedOption[];
  optionsPrice: number;
}

// Valida la configuración elegida por el cliente contra los grupos de opciones
// del producto y devuelve el snapshot con precios calculados en el servidor.
// Nunca confía en los precios que envía el frontend.
export function validateProductConfiguration(
  product: IProduct,
  selections: SelectedOptionInput[] = []
): ConfigurationResult {
  const groups = product.optionGroups || [];
  const groupById = new Map(groups.map((g) => [String(g._id), g]));

  for (const sel of selections) {
    if (!groupById.has(sel.groupId)) {
      throw new AppError('La configuración del producto es inválida', 400);
    }
  }

  const options: PricedOption[] = [];
  let optionsPrice = 0;

  for (const group of groups) {
    const groupId = String(group._id);
    const groupSelections = selections.filter((s) => s.groupId === groupId);

    // Si el cliente no eligió nada, se aplican las opciones marcadas por defecto.
    let entries = groupSelections;
    if (entries.length === 0) {
      const defaults = (group.options || []).filter((o) => o.active && o.default);
      const chosen = group.type === 'single' ? defaults.slice(0, 1) : defaults;
      entries = chosen.map((o) => ({ groupId, optionId: String(o._id), quantity: 1 }));
    }

    if (group.required && entries.length === 0) {
      throw new AppError(`Debes elegir una opción en "${group.name}"`, 400);
    }
    if (group.type === 'single' && entries.length > 1) {
      throw new AppError(`Solo puedes elegir una opción en "${group.name}"`, 400);
    }
    if (entries.length < (group.min || 0)) {
      throw new AppError(`Debes elegir al menos ${group.min} opción(es) en "${group.name}"`, 400);
    }
    if (group.max > 0 && entries.length > group.max) {
      throw new AppError(`Puedes elegir como máximo ${group.max} opción(es) en "${group.name}"`, 400);
    }

    for (const entry of entries) {
      const option = (group.options || []).find((o) => String(o._id) === entry.optionId);
      if (!option || !option.active) {
        throw new AppError(`La opción elegida en "${group.name}" no está disponible`, 400);
      }

      let quantity = 1;
      const requested = entry.quantity ?? 1;
      if (option.allowQuantity) {
        if (!Number.isInteger(requested) || requested < 1) {
          throw new AppError(`Cantidad inválida en "${group.name}"`, 400);
        }
        if (requested > option.maxQuantity) {
          throw new AppError(`Puedes elegir hasta ${option.maxQuantity} de "${option.name}"`, 400);
        }
        quantity = requested;
      } else if (requested !== 1) {
        throw new AppError(`"${option.name}" no admite cantidad`, 400);
      }

      optionsPrice += option.price * quantity;
      options.push({
        groupId,
        groupName: group.name,
        optionId: String(option._id),
        optionName: option.name,
        price: option.price,
        quantity,
      });
    }
  }

  return { options, optionsPrice };
}
