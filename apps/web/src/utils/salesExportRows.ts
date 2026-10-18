import type { Order, OrderItem } from '@/types';

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const cents = (value: number) => Math.round(value * 100);
export const safeExcelText = (value: string) => /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;

const orderId = (order: Order) => String(order._id ?? 'Sin ID');
const ingredientName = (item: OrderItem) => (item.ingredientes || [])
  .map((ingredient) => `${ingredient.ingredienteNombre}${ingredient.cantidad > 1 ? ` x${ingredient.cantidad}` : ''}`)
  .join(', ');
const addonName = (item: OrderItem) => (item.additionals || [])
  .map((addon) => `${addon.name}${addon.quantity > 1 ? ` x${addon.quantity}` : ''}`)
  .join(', ');

export function orderDescription(order: Order, separator = '\n'): string {
  return order.items.map((item) => {
    const details = [ingredientName(item), addonName(item)].filter(Boolean);
    return `${item.quantity}x ${item.title}${details.length ? ` (${details.join('; ')})` : ''}`;
  }).join(separator);
}

export function tramititoConcept(order: Order): string {
  const testPrefix = order.customer.name.startsWith('PRUEBA KOGO') ? 'PRUEBA - ' : '';
  return safeExcelText(`${testPrefix}Pedido KOGO #${orderId(order)} - ${orderDescription(order, ' | ')}`);
}

type Component = { product: string; type: 'Producto' | 'Ingrediente' | 'Adicional'; name: string; qty: number; grossCents: number; discountCents: number };

function orderComponents(order: Order): Component[] {
  const components: Component[] = [];
  for (const item of order.items) {
    components.push({ product: item.title, type: 'Producto', name: item.title, qty: item.quantity,
      grossCents: cents((item.precioBaseUnidad ?? item.price) * item.quantity), discountCents: 0 });
    for (const ingredient of item.ingredientes || []) {
      components.push({ product: item.title, type: 'Ingrediente', name: ingredient.ingredienteNombre,
        qty: ingredient.cantidad * item.quantity, grossCents: cents(ingredient.precio * ingredient.cantidad * item.quantity), discountCents: 0 });
    }
    for (const addon of item.additionals || []) {
      components.push({ product: item.title, type: 'Adicional', name: addon.name,
        qty: addon.quantity, grossCents: cents(addon.price * addon.quantity), discountCents: 0 });
    }
  }
  const subtotalCents = cents(order.subtotal);
  const grossCents = components.reduce((sum, component) => sum + component.grossCents, 0);
  if (grossCents !== subtotalCents) {
    throw new Error(`El pedido #${orderId(order)} tiene un subtotal que no coincide con sus productos y extras.`);
  }
  const discountCents = subtotalCents + cents(order.deliveryCost || 0) - cents(order.total);
  if (discountCents < 0 || discountCents > subtotalCents) {
    throw new Error(`El pedido #${orderId(order)} tiene importes inconsistentes.`);
  }
  let remainingDiscount = discountCents;
  let remainingGross = grossCents;
  for (const component of components) {
    const allocated = remainingGross ? Math.round(remainingDiscount * component.grossCents / remainingGross) : 0;
    component.discountCents = allocated;
    remainingDiscount -= allocated;
    remainingGross -= component.grossCents;
  }
  return components;
}

export function buildSalesExportRows(orders: Order[]) {
  const orderRows: Record<string, string | number>[] = [];
  const otherRows: Record<string, string | number>[] = [];
  const grouped = new Map<string, Component>();

  for (const order of orders) {
    if (!Number.isFinite(order.subtotal) || !Number.isFinite(order.total) || !Number.isFinite(order.deliveryCost ?? 0)) {
      throw new Error(`El pedido #${orderId(order)} no tiene importes completos.`);
    }
    const components = orderComponents(order);
    const date = new Date(order.createdAt || 0);
    const coupon = order.couponCode
      ? `${order.couponCode}${order.discountPercent ? ` (-${order.discountPercent}%)` : ''}`
      : order.discountPercent ? `-${order.discountPercent}%` : '-';
    orderRows.push({
      Pedido: safeExcelText(orderId(order)),
      Fecha: date.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      Hora: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
      Cliente: safeExcelText(order.customer.name),
      Detalle: safeExcelText(orderDescription(order)),
      Entrega: order.deliveryType === 'delivery' ? 'Envío' : 'Retiro',
      Pago: order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'transfer' ? 'Transferencia' : 'Mercado Pago',
      Cupon: safeExcelText(coupon),
      Subtotal: money(order.subtotal),
      Descuento: money((cents(order.subtotal) + cents(order.deliveryCost || 0) - cents(order.total)) / 100),
      Envio: money(order.deliveryCost || 0),
      Total: money(order.total),
    });
    otherRows.push({ monto: money(order.total), concepto: tramititoConcept(order), doc: '' });

    for (const component of components) {
      const key = JSON.stringify([component.product, component.type, component.name]);
      const previous = grouped.get(key);
      if (previous) {
        previous.qty += component.qty;
        previous.grossCents += component.grossCents;
        previous.discountCents += component.discountCents;
      } else grouped.set(key, { ...component });
    }
  }

  const productRows = [...grouped.values()]
    .sort((a, b) => a.product.localeCompare(b.product, 'es') ||
      ['Producto', 'Ingrediente', 'Adicional'].indexOf(a.type) - ['Producto', 'Ingrediente', 'Adicional'].indexOf(b.type) ||
      a.name.localeCompare(b.name, 'es'))
    .map((component) => ({
      Tipo: component.type,
      Producto: safeExcelText(component.product),
      Concepto: safeExcelText(component.name),
      Cantidad: component.qty,
      Bruto: component.grossCents / 100,
      Descuento: component.discountCents / 100,
      Neto: (component.grossCents - component.discountCents) / 100,
    }));
  return { orderRows, productRows, otherRows };
}
