import { Order } from '@/types';

export async function exportVentas(orders: Order[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const orderData = orders.flatMap((o) => {
    const d = new Date(o.createdAt!);
    const discountLabel = o.discountPercent > 0 ? `-${o.discountPercent}%` : '-';
    return o.items.flatMap((item) => {
      const baseData = {
        Fecha: d.toLocaleDateString('es-AR'),
        Hora: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        Cliente: o.customer.name,
        Producto: item.title,
        Adicionales: (item.additionals || []).map((a) => a.name + (a.quantity > 1 ? ` x${a.quantity}` : '')).join(', ') || '-',
        Cantidad: item.quantity,
        Pago: o.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
        Cupon: discountLabel,
        Total: o.netTotal ?? (o.total - o.deliveryCost),
      };
      const rows = [baseData];
      return rows;
    });
  });

  const ws1 = XLSX.utils.json_to_sheet(orderData);
  ws1['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Pedidos');

  const pMap = new Map<string, { qty: number; revenue: number; discount: number }>();
  const aMap = new Map<string, { productTitle: string; qty: number; revenue: number; discount: number }>();

  for (const o of orders) {
    const factor = o.discountPercent / 100;
    for (const item of o.items) {
      const baseRev = item.price * item.quantity;
      let addonsRev = 0;
      if (item.additionals) for (const a of item.additionals) addonsRev += a.price * a.quantity;

      const baseDisc = baseRev * factor;
      const baseNet = baseRev - baseDisc;

      const prod = pMap.get(item.title);
      if (prod) { prod.qty += item.quantity; prod.revenue += baseNet; prod.discount += baseDisc; }
      else pMap.set(item.title, { qty: item.quantity, revenue: baseNet, discount: baseDisc });

      if (item.additionals) {
        for (const a of item.additionals) {
          const aRev = a.price * a.quantity;
          const aDisc = aRev * factor;
          const aNet = aRev - aDisc;
          const key = `${item.title}|||${a.name}`;
          const add = aMap.get(key);
          if (add) { add.qty += a.quantity; add.revenue += aNet; add.discount += aDisc; }
          else aMap.set(key, { productTitle: item.title, qty: a.quantity, revenue: aNet, discount: aDisc });
        }
      }
    }
  }

  const groupedData: any[] = [];
  for (const [title, data] of [...pMap.entries()].sort((a, b) => (b[1].revenue + b[1].discount) - (a[1].revenue + a[1].discount))) {
    groupedData.push({ Producto: title, Cantidad: data.qty, Descuento: data.discount > 0 ? -data.discount : 0, Total: data.revenue });
    for (const [key, adata] of aMap) {
      if (key.startsWith(title + '|||')) {
        const addonName = key.slice(title.length + 3);
        groupedData.push({ Producto: `  + ${addonName}`, Cantidad: adata.qty, Descuento: adata.discount > 0 ? -adata.discount : 0, Total: adata.revenue });
      }
    }
  }

  const ws2 = XLSX.utils.json_to_sheet(groupedData);
  ws2['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Agrupado');

  XLSX.writeFile(wb, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
