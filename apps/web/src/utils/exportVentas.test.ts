import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import type { Order } from '../types';
import { exportVentas } from './exportVentas';
import { buildSalesExportRows } from './salesExportRows';

const orders = [
  {
    _id: '507f1f77bcf86cd799439011', createdAt: new Date('2026-10-18T14:47:00Z'),
    customer: { name: '=1+1', phone: '000' }, deliveryType: 'delivery', paymentMethod: 'transfer',
    status: 'delivered', couponCode: 'PROMO10', discountPercent: 10,
    items: [
      { title: 'Kogo Junior', price: 100, quantity: 1, ingredientes: [], additionals: [], precioBaseUnidad: 100 },
      { title: 'Kogo Junior', price: 100, quantity: 1, precioBaseUnidad: 100,
        ingredientes: [{ ingredienteNombre: 'Picante', precio: 5, cantidad: 1 }],
        additionals: [{ name: 'Queso Extra', price: 10, quantity: 1 }] },
    ], subtotal: 215, deliveryCost: 20, total: 213.50,
  },
  {
    _id: '507f1f77bcf86cd799439012', createdAt: new Date('2026-09-18T14:47:00Z'),
    customer: { name: 'Cliente', phone: '001' }, deliveryType: 'pickup', paymentMethod: 'mercadopago',
    status: 'delivered', discountPercent: 0,
    items: [{ title: '+Fórmula', price: 50.25, quantity: 2, ingredientes: [], additionals: [] }],
    subtotal: 100.50, deliveryCost: 0, total: 100.50,
  },
] as Order[];

test('una fila por pedido, desglose por producto y OTRO conciliados', async () => {
  const { orderRows, productRows, otherRows } = buildSalesExportRows(orders);
  assert.equal(orderRows.length, 2);
  assert.equal(otherRows.length, 2);
  assert.match(String(orderRows[0].Detalle), /1x Kogo Junior[\s\S]*1x Kogo Junior/);
  assert.equal(orderRows[0].Subtotal, 215);
  assert.equal(orderRows[0].Descuento, 21.5);
  assert.equal(orderRows[0].Envio, 20);
  assert.equal(orderRows[0].Total, 213.5);
  assert.equal(orderRows[0].Cliente, "'=1+1");
  assert.equal(otherRows[0].monto, orderRows[0].Total);
  assert.equal(otherRows[0].doc, '');
  assert.match(String(otherRows[0].concepto), /Queso Extra/);
  assert.equal(productRows.reduce((sum, row) => sum + Number(row.Neto), 0), 294);
  assert.equal(productRows.some((row) => row.Tipo === 'Ingrediente' && row.Concepto === 'Picante'), true);
  assert.equal(productRows.some((row) => row.Tipo === 'Adicional' && row.Concepto === 'Queso Extra'), true);
  assert.equal(productRows.some((row) => row.Concepto === "'+Fórmula"), true);
});

test('el archivo contiene tres hojas, importes numéricos y ninguna fila duplicada', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'kogo-ventas-'));
  const previousDirectory = process.cwd();
  try {
    process.chdir(directory);
    await exportVentas(orders);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(directory, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`));
    assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Pedidos', 'Productos', 'OTRO']);
    const detail = workbook.getWorksheet('Pedidos')!;
    const other = workbook.getWorksheet('OTRO')!;
    assert.equal(detail.rowCount, 3);
    assert.equal(other.rowCount, 3);
    assert.deepEqual([1, 2, 3].map((column) => other.getRow(1).getCell(column).value), ['monto', 'concepto', 'doc']);
    assert.equal(typeof detail.getCell('L2').value, 'number');
    assert.equal(detail.getCell('L2').value, other.getCell('A2').value);
    assert.equal(detail.getCell('L3').value, other.getCell('A3').value);
    assert.equal(other.getCell('A2').numFmt, '#,##0.00');
  } finally {
    process.chdir(previousDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});

test('no exporta silenciosamente importes inconsistentes', () => {
  assert.throws(() => buildSalesExportRows([{ ...orders[0], subtotal: 999 }]), /subtotal/);
});

test('un período vacío conserva las tres tablas sin filas de venta', () => {
  const result = buildSalesExportRows([]);
  assert.deepEqual(result, { orderRows: [], productRows: [], otherRows: [] });
});
