import axios from 'axios';
import { MERCADOPAGO_API_BASE_URL } from '../../constants';

// ============================================================
// Cliente HTTP para la Orders API de Mercado Pago (Checkout Pro).
//
// SEGURIDAD:
//  - El access token se lee de variables de entorno y NUNCA se loguea
//    ni se devuelve al cliente.
//  - No se envían datos de tarjeta: el cobro ocurre en el checkout de MP.
// ============================================================

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
  }
  return token;
}

export interface MercadoPagoOrderItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface MercadoPagoBackUrls {
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
}

export interface CreateMercadoPagoOrderInput {
  externalReference: string;
  totalAmount: number;
  description?: string;
  items: MercadoPagoOrderItem[];
  backUrls?: MercadoPagoBackUrls;
}

export interface MercadoPagoOrderResult {
  id: string;
  status: string;
  statusDetail?: string | null;
  checkoutUrl?: string | null;
  externalReference?: string | null;
  totalAmount?: number | null;
  currencyId?: string | null;
}

function toResult(data: any): MercadoPagoOrderResult {
  return {
    id: String(data.id),
    status: String(data.status ?? ''),
    statusDetail: data.status_detail ?? null,
    checkoutUrl: data.checkout_url ?? null,
    externalReference: data.external_reference ?? null,
    totalAmount:
      data.total_amount !== undefined && data.total_amount !== null
        ? Number(data.total_amount)
        : null,
    currencyId: data.currency_id ?? data.currency ?? null,
  };
}

export const MercadoPagoClient = {
  /**
   * Crea una Order de Checkout Pro y devuelve la URL de checkout.
   * Requiere X-Idempotency-Key único por intento para evitar órdenes duplicadas.
   */
  createOrder: async (
    input: CreateMercadoPagoOrderInput,
    idempotencyKey: string
  ): Promise<MercadoPagoOrderResult> => {
    const body: Record<string, unknown> = {
      type: 'online',
      processing_mode: 'manual',
      total_amount: input.totalAmount.toFixed(2),
      external_reference: input.externalReference,
      items: input.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice.toFixed(2),
      })),
    };

    if (input.description) {
      body.description = input.description;
    }

    // URLs de retorno (config.online). Son solo informativas: la confirmación
    // real del pago llega por webhook, no por esta redirección.
    if (input.backUrls) {
      body.config = {
        online: {
          success_url: input.backUrls.successUrl,
          pending_url: input.backUrls.pendingUrl,
          failure_url: input.backUrls.failureUrl,
          auto_return: 'all',
        },
      };
    }

    const { data } = await axios.post(`${MERCADOPAGO_API_BASE_URL}/v1/orders`, body, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      timeout: 15000,
    });

    return toResult(data);
  },

  /** Consulta una Order existente por su id (para conciliación). */
  getOrder: async (mpOrderId: string): Promise<MercadoPagoOrderResult> => {
    const { data } = await axios.get(`${MERCADOPAGO_API_BASE_URL}/v1/orders/${mpOrderId}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      timeout: 15000,
    });

    return toResult(data);
  },
};
