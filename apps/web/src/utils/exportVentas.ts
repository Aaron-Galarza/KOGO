import type { Order } from '@/types';
import { buildSalesExportRows } from './salesExportRows';

const MONEY_FORMAT = '#,##0.00';

export async function exportVentas(orders: Order[]) {
  const { orderRows, productRows, otherRows } = buildSalesExportRows(orders);
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();

  const addSheet = (name: string, headers: string[], widths: number[], rows: Record<string, string | number>[], moneyColumns: string[]) => {
    const sheet = wb.addWorksheet(name);
    sheet.columns = headers.map((header, index) => ({ header, key: header, width: widths[index] }));
    for (const row of rows) sheet.addRow(row);
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(sheet.rowCount, 1), column: headers.length } };
    for (const column of moneyColumns) sheet.getColumn(column).numFmt = MONEY_FORMAT;
    return sheet;
  };

  const detail = addSheet('Pedidos',
    ['Pedido', 'Fecha', 'Hora', 'Cliente', 'Detalle', 'Entrega', 'Pago', 'Cupon', 'Subtotal', 'Descuento', 'Envio', 'Total'],
    [28, 14, 13, 24, 80, 12, 18, 18, 16, 16, 16, 16], orderRows,
    ['Subtotal', 'Descuento', 'Envio', 'Total']);
  detail.getColumn('Detalle').alignment = { wrapText: true, vertical: 'top' };
  for (let index = 2; index <= detail.rowCount; index++) {
    detail.getRow(index).height = Math.max(24, String(detail.getCell(`E${index}`).value).split('\n').length * 32);
  }

  addSheet('Productos',
    ['Tipo', 'Producto', 'Concepto', 'Cantidad', 'Bruto', 'Descuento', 'Neto'],
    [16, 32, 32, 12, 16, 16, 16], productRows,
    ['Bruto', 'Descuento', 'Neto']);

  addSheet('OTRO', ['monto', 'concepto', 'doc'], [18, 100, 18], otherRows, ['monto']);

  const filename = `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  if (typeof document === 'undefined') {
    await wb.xlsx.writeFile(filename);
    return;
  }
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
