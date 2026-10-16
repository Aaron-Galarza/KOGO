import crypto from 'crypto';

// ============================================================
// Validación de la firma de los webhooks de Mercado Pago.
//
// Mercado Pago envía los encabezados:
//   x-signature: ts=<timestamp>,v1=<hmac_sha256_hex>
//   x-request-id: <id>
// y el id del recurso llega como query `data.id` (o en el body).
//
// El "manifest" a firmar tiene la forma:
//   id:[data.id];request-id:[x-request-id];ts:[ts];
// y la clave es el "secret" del webhook (solo en variables de entorno).
//
// Este módulo es puro: no accede a red ni a base de datos.
// ============================================================

export function buildWebhookManifest(params: {
  dataId?: string | null;
  requestId?: string | null;
  ts?: string | null;
}): string {
  return `id:${params.dataId ?? ''};request-id:${params.requestId ?? ''};ts:${params.ts ?? ''};`;
}

export function parseSignatureHeader(header?: string | null): { ts?: string; v1?: string } {
  if (!header) return {};
  const result: { ts?: string; v1?: string } = {};
  for (const part of header.split(',')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key === 'ts') result.ts = value;
    if (key === 'v1') result.v1 = value;
  }
  return result;
}

export function computeWebhookSignature(manifest: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex');
}

/** Devuelve true solo si la firma es válida para el manifest esperado. */
export function verifyMercadoPagoSignature(params: {
  xSignature?: string | null;
  xRequestId?: string | null;
  dataId?: string | null;
  secret: string;
}): boolean {
  const { ts, v1 } = parseSignatureHeader(params.xSignature);
  if (!ts || !v1) return false;

  const manifest = buildWebhookManifest({
    dataId: params.dataId,
    requestId: params.xRequestId,
    ts,
  });
  const expected = computeWebhookSignature(manifest, params.secret);

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(v1, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
