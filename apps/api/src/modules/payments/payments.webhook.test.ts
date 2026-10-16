import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWebhookManifest,
  computeWebhookSignature,
  parseSignatureHeader,
  verifyMercadoPagoSignature,
} from './payments.webhook';

const SECRET = 'test-secret';

test('buildWebhookManifest arma el template esperado', () => {
  assert.equal(
    buildWebhookManifest({ dataId: '123', requestId: 'req-1', ts: '1700000000' }),
    'id:123;request-id:req-1;ts:1700000000;'
  );
});

test('parseSignatureHeader extrae ts y v1', () => {
  const parsed = parseSignatureHeader('ts=1700000000,v1=abc123');
  assert.equal(parsed.ts, '1700000000');
  assert.equal(parsed.v1, 'abc123');
});

test('verifyMercadoPagoSignature acepta una firma válida', () => {
  const dataId = '123';
  const xRequestId = 'req-1';
  const ts = '1700000000';
  const manifest = buildWebhookManifest({ dataId, requestId: xRequestId, ts });
  const v1 = computeWebhookSignature(manifest, SECRET);

  const ok = verifyMercadoPagoSignature({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId,
    dataId,
    secret: SECRET,
  });

  assert.equal(ok, true);
});

test('verifyMercadoPagoSignature rechaza una firma inválida', () => {
  const ok = verifyMercadoPagoSignature({
    xSignature: 'ts=1700000000,v1=deadbeef',
    xRequestId: 'req-1',
    dataId: '123',
    secret: SECRET,
  });

  assert.equal(ok, false);
});

test('verifyMercadoPagoSignature rechaza si faltan encabezados', () => {
  const ok = verifyMercadoPagoSignature({
    xSignature: null,
    xRequestId: null,
    dataId: '123',
    secret: SECRET,
  });

  assert.equal(ok, false);
});

test('verifyMercadoPagoSignature rechaza si cambia el dataId (replay/alteración)', () => {
  const ts = '1700000000';
  const manifest = buildWebhookManifest({ dataId: '123', requestId: 'req-1', ts });
  const v1 = computeWebhookSignature(manifest, SECRET);

  const ok = verifyMercadoPagoSignature({
    xSignature: `ts=${ts},v1=${v1}`,
    xRequestId: 'req-1',
    dataId: '999',
    secret: SECRET,
  });

  assert.equal(ok, false);
});
