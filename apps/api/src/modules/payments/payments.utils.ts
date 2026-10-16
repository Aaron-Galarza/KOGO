// ============================================================
// Utilidades puras para construir el pedido de Mercado Pago.
// Sin acceso a base de datos ni a red: fácil de testear.
// ============================================================

import { PaymentStatus } from '../../constants';

export interface MercadoPagoLineSource {
  title: string;
  quantity: number;
  totalLinea: number;
  additionals: { name: string; price: number; quantity: number }[];
}

export interface MercadoPagoItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

const toCents = (value: number) => Math.round((value || 0) * 100);

/**
 * Convierte la instantánea de un pedido en items de Mercado Pago cuyo importe
 * suma EXACTAMENTE `total`.
 *
 * Mercado Pago exige que la suma de (unit_price * quantity) sea igual a
 * total_amount. Como el pedido puede tener cupón (descuento) o envío agregado
 * después, se ajusta el importe:
 *  - Si `total` < suma de líneas: se reparte el descuento proporcionalmente
 *    (en centavos, la última línea absorbe el redondeo).
 *  - Si `total` > suma de líneas: se agrega una línea por la diferencia
 *    (por ejemplo, el envío).
 */
export function buildMercadoPagoItems(
  items: MercadoPagoLineSource[],
  total: number
): MercadoPagoItem[] {
  const lines = items.map((item) => {
    const quantity = item.quantity > 0 ? item.quantity : 1;
    const addonsCents = (item.additionals || []).reduce(
      (acc, addon) => acc + toCents(addon.price * addon.quantity),
      0
    );
    const addonLabel = (item.additionals || [])
      .map((addon) => `${addon.quantity}x ${addon.name}`)
      .join(', ');
    const title = addonLabel
      ? `${quantity}x ${item.title} (+ ${addonLabel})`
      : `${quantity}x ${item.title}`;

    return { title, cents: toCents(item.totalLinea) + addonsCents };
  });

  const rawCents = lines.reduce((acc, line) => acc + line.cents, 0);
  const targetCents = toCents(total);

  // El total supera lo sumado por las líneas (p. ej. envío): se agrega la diferencia.
  if (targetCents > rawCents) {
    const result = lines
      .filter((line) => line.cents > 0)
      .map((line) => ({ title: line.title, quantity: 1, unitPrice: line.cents / 100 }));
    result.push({ title: 'Envío', quantity: 1, unitPrice: (targetCents - rawCents) / 100 });
    return result;
  }

  // El total es menor (cupón/descuento): se reparte el descuento proporcionalmente.
  const discountCents = Math.max(0, rawCents - targetCents);
  let remaining = discountCents;
  const result: MercadoPagoItem[] = [];

  lines.forEach((line, index) => {
    let cut = 0;
    if (discountCents > 0 && rawCents > 0) {
      cut =
        index === lines.length - 1
          ? remaining
          : Math.min(remaining, Math.round((line.cents / rawCents) * discountCents));
      remaining -= cut;
    }

    const finalCents = Math.max(0, line.cents - cut);
    if (finalCents > 0) {
      result.push({ title: line.title, quantity: 1, unitPrice: finalCents / 100 });
    }
  });

  return result;
}

/**
 * Traduce el estado de una Order de Mercado Pago al estado de pago de KOGO.
 * Nunca decide por sí sola: el servicio valida importe/moneda/referencia antes
 * de aceptar un "approved".
 */
export function mapMercadoPagoStatus(
  status: string | null | undefined,
  statusDetail?: string | null
): PaymentStatus {
  switch (status) {
    case 'processed':
      if (statusDetail === 'accredited') return 'approved';
      if (statusDetail === 'pending_waiting_payment') return 'pending';
      return 'in_process';
    case 'created':
    case 'processing':
    case 'action_required':
      return 'in_process';
    case 'failed':
      return 'rejected';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    default:
      return 'in_process';
  }
}

/**
 * Regla anti-regresión: una vez "approved", solo un reembolso puede cambiarlo.
 * Evita que webhooks duplicados o fuera de orden reviertan un pago acreditado.
 */
export function canTransitionPaymentStatus(
  current: PaymentStatus,
  next: PaymentStatus
): boolean {
  if (current === next) return false;
  if (current === 'approved' && next !== 'refunded') return false;
  return true;
}

/**
 * Valida que un pago "approved" coincida con el pedido local.
 * Si algo no cuadra, NO se debe acreditar.
 */
export function isApprovalConsistent(params: {
  expectedAmount: number;
  expectedReference: string;
  expectedCurrency: string;
  receivedAmount?: number | null;
  receivedReference?: string | null;
  receivedCurrency?: string | null;
}): boolean {
  const referenceOk = params.receivedReference === params.expectedReference;
  if (!referenceOk) return false;

  if (
    params.receivedCurrency != null &&
    params.receivedCurrency !== params.expectedCurrency
  ) {
    return false;
  }

  if (params.receivedAmount != null) {
    const diff = Math.abs(params.receivedAmount - params.expectedAmount);
    if (diff > 0.01) return false;
  }

  return true;
}
