import { Order } from '@/types';

export function printComanda(order: Order, shippingCost?: number, discount?: number) {
  const date = new Date(order.createdAt || '').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const time = new Date(order.createdAt || '').toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const type = order.deliveryType === 'delivery' ? 'Envio' : 'Retiro';
  const payment = order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia';

  const products = order.items.map((item) => {
    const adds = item.additionals?.map((a) => `<li style="margin:0;font-size:.9em">&#8627; ${a.name}</li>`).join('') || '';
    return `<p style="margin:0;font-weight:bold"><strong>- ${item.title} x${item.quantity}</strong></p>${adds ? `<ul style="list-style:none;padding-left:15px;margin:5px 0">${adds}</ul>` : ''}`;
  }).join('');

  const address = order.deliveryType === 'delivery' && order.delivery?.address
    ? `<p style="margin:5px 0"><strong>Direccion:</strong> ${order.delivery.address}</p>` : '';

  const discountHtml = discount ? `<p style="font-size:1.1em;font-weight:bold">Descuento: <strong>-$${discount.toLocaleString('es-AR')}</strong></p>` : '';
  const envioHtml = shippingCost ? `<p style="font-size:1.1em;font-weight:bold">Envio: <strong>$${shippingCost.toLocaleString('es-AR')}</strong></p>` : '';
  const totalFinal = (order.total ?? 0) - (discount ?? 0) + (shippingCost ?? 0);

  const html = `<!DOCTYPE html><html><head><title>Comanda</title><style>
    body{font-family:'Courier New',monospace;font-size:14px;line-height:1.2;margin:0;padding:10px}
    .ticket{width:300px;margin:0 auto;padding:10px;box-sizing:border-box;border:1px solid #000}
    h3{text-align:center;margin:5px 0;font-size:1.5em}
    .sep{border-top:1px dashed #000;margin:10px 0}
    .details p{margin:5px 0;font-size:1.1em;font-weight:bold}
    </style></head><body><div class="ticket">
    <div style="text-align:center"><h3>CHEEPERS</h3></div>
    <div class="sep"></div>
    <div class="details">
      <p><strong>Fecha:</strong> ${date} | <strong>Hora:</strong> ${time}</p>
      <p><strong>Tipo:</strong> ${type}</p>
      <p><strong>Cliente:</strong> ${order.customer.name}</p>
      <p><strong>Telefono:</strong> ${order.customer.phone}</p>
      ${address}
    </div>
    <div class="sep"></div>
    <div>${products}</div>
    <div class="sep"></div>
    <div style="text-align:right">
      <p style="font-size:1.1em;font-weight:bold"><strong>Pago:</strong> ${payment}</p>
      <p style="font-size:1.1em;font-weight:bold">Subtotal: <strong>$${order.total?.toLocaleString('es-AR') ?? '0'}</strong></p>
      ${discountHtml}
      ${envioHtml}
      <p style="font-size:1.2em"><strong>TOTAL: $${totalFinal.toLocaleString('es-AR')}</strong></p>
    </div>
  </div></body></html>`;

  const w = window.open('', '_blank', 'width=350,height=600');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }
}
