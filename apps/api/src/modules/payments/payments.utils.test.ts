import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMercadoPagoItems,
  mapMercadoPagoStatus,
  canTransitionPaymentStatus,
  isApprovalConsistent,
  MercadoPagoItem,
} from './payments.utils';

// Suma de los items en centavos (como los interpreta Mercado Pago).
const sumCents = (items: MercadoPagoItem[]) =>
  items.reduce((acc, item) => acc + Math.round(item.unitPrice * item.quantity * 100), 0);

test('sin descuento: la suma de items iguala exactamente el total', () => {
  const items = buildMercadoPagoItems(
    [
      { title: 'Pizza', quantity: 2, totalLinea: 8000, additionals: [] },
      { title: 'Coca', quantity: 1, totalLinea: 2000, additionals: [] },
    ],
    10000
  );

  assert.equal(sumCents(items), 1000000);
});

test('con cupón: reparte el descuento y la suma iguala exactamente el total', () => {
  const items = buildMercadoPagoItems(
    [
      { title: 'Pizza', quantity: 1, totalLinea: 10000, additionals: [] },
      { title: 'Empanada', quantity: 1, totalLinea: 3333, additionals: [] },
    ],
    12000
  );

  assert.equal(sumCents(items), 1200000);
});

test('con envío (total mayor a las líneas): agrega una línea y suma exacto', () => {
  const items = buildMercadoPagoItems(
    [{ title: 'Pizza', quantity: 1, totalLinea: 10000, additionals: [] }],
    10500
  );

  assert.equal(sumCents(items), 1050000);
  assert.ok(items.some((item) => item.title === 'Envío'));
});

test('incluye los adicionales en el importe de la línea', () => {
  const items = buildMercadoPagoItems(
    [
      {
        title: 'Burger',
        quantity: 1,
        totalLinea: 8000,
        additionals: [{ name: 'Cheddar', price: 500, quantity: 2 }],
      },
    ],
    9000
  );

  assert.equal(sumCents(items), 900000);
});

test('nunca genera items con importe negativo o cero', () => {
  const items = buildMercadoPagoItems(
    [{ title: 'Pizza', quantity: 1, totalLinea: 1000, additionals: [] }],
    1000
  );

  assert.ok(items.every((item) => item.unitPrice > 0));
});

test('mapMercadoPagoStatus traduce los estados relevantes', () => {
  assert.equal(mapMercadoPagoStatus('processed', 'accredited'), 'approved');
  assert.equal(mapMercadoPagoStatus('processed', 'pending_review_manual'), 'in_process');
  assert.equal(mapMercadoPagoStatus('created'), 'in_process');
  assert.equal(mapMercadoPagoStatus('processing'), 'in_process');
  assert.equal(mapMercadoPagoStatus('action_required'), 'in_process');
  assert.equal(mapMercadoPagoStatus('failed'), 'rejected');
  assert.equal(mapMercadoPagoStatus('canceled'), 'cancelled');
  assert.equal(mapMercadoPagoStatus('refunded'), 'refunded');
  assert.equal(mapMercadoPagoStatus('processed', 'pending_waiting_payment'), 'pending');
});

test('canTransitionPaymentStatus impide revertir un pago aprobado', () => {
  assert.equal(canTransitionPaymentStatus('pending', 'approved'), true);
  assert.equal(canTransitionPaymentStatus('approved', 'pending'), false);
  assert.equal(canTransitionPaymentStatus('approved', 'in_process'), false);
  assert.equal(canTransitionPaymentStatus('approved', 'refunded'), true);
  assert.equal(canTransitionPaymentStatus('approved', 'approved'), false);
});

test('isApprovalConsistent exige referencia, moneda e importe', () => {
  const base = {
    expectedAmount: 1000,
    expectedReference: 'order-1',
    expectedCurrency: 'ARS',
    receivedAmount: 1000,
    receivedReference: 'order-1',
    receivedCurrency: 'ARS',
  };

  assert.equal(isApprovalConsistent(base), true);
  assert.equal(isApprovalConsistent({ ...base, receivedReference: 'order-2' }), false);
  assert.equal(isApprovalConsistent({ ...base, receivedCurrency: 'USD' }), false);
  assert.equal(isApprovalConsistent({ ...base, receivedAmount: 999 }), false);
  assert.equal(isApprovalConsistent({ ...base, receivedAmount: 1000.005 }), true);
});

