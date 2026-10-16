import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDeliveryPricing, DeliveryPricingInput } from './delivery.utils';

const base: DeliveryPricingInput = {
  kmRanges: [
    { maxKm: 3, price: 1500 },
    { maxKm: 6, price: 2500 },
    { maxKm: 10, price: 4000 },
  ],
  maxDeliveryKm: 12,
  extraRain: 0,
  isRaining: false,
  distanceKm: 1,
};

test('dentro del primer rango cobra el precio del primer tramo', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 2.4 });
  assert.equal(result.deliveryCost, 1500);
  assert.equal(result.matchedMaxKm, 3);
  assert.equal(result.outOfRange, false);
  assert.equal(result.deliverable, true);
});

test('en el límite exacto del rango se aplica ese rango', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 3 });
  assert.equal(result.deliveryCost, 1500);
  assert.equal(result.matchedMaxKm, 3);
});

test('entre rangos cobra el tramo que corresponde', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 5.9 });
  assert.equal(result.deliveryCost, 2500);
  assert.equal(result.matchedMaxKm, 6);
});

test('más lejos que el último rango cobra el último tramo y avisa outOfRange', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 11 });
  assert.equal(result.deliveryCost, 4000);
  assert.equal(result.outOfRange, true);
  assert.equal(result.deliverable, true);
});

test('fuera del radio máximo no se cobra automático', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 13.5 });
  assert.equal(result.deliveryCost, 0);
  assert.equal(result.deliverable, false);
  assert.equal(result.outOfRange, true);
});

test('sin lluvia no hay recargo', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 2, extraRain: 800, isRaining: false });
  assert.equal(result.rainSurcharge, 0);
  assert.equal(result.deliveryCost, 1500);
});

test('con lluvia suma el recargo configurado', () => {
  const result = computeDeliveryPricing({ ...base, distanceKm: 2, extraRain: 800, isRaining: true });
  assert.equal(result.rainSurcharge, 800);
  assert.equal(result.deliveryCost, 2300);
});

test('sin rangos configurados no se inventa precio: se coordina a mano', () => {
  const result = computeDeliveryPricing({ ...base, kmRanges: [], distanceKm: 2 });
  assert.equal(result.configMissing, true);
  assert.equal(result.deliverable, false);
  assert.equal(result.deliveryCost, 0);
  assert.equal(result.outOfRange, true);
});

test('los rangos desordenados se ordenan antes de calcular', () => {
  const result = computeDeliveryPricing({
    ...base,
    kmRanges: [
      { maxKm: 10, price: 4000 },
      { maxKm: 3, price: 1500 },
      { maxKm: 6, price: 2500 },
    ],
    distanceKm: 5,
  });
  assert.equal(result.deliveryCost, 2500);
  assert.equal(result.matchedMaxKm, 6);
});
