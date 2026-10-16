import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { verifyMercadoPagoSignature } from './payments.webhook';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class PaymentsController {
  static createCheckout = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;
    const result = await PaymentsService.createCheckout(orderId);
    sendSuccess(res, result, 201, 'Checkout iniciado');
  });

  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await PaymentsService.getPaymentStatus(orderId);
    // El estado de pago cambia con el tiempo: esta respuesta no debe cachearse.
    res.set('Cache-Control', 'no-store');
    sendSuccess(res, result);
  });

  /**
   * Webhook de Mercado Pago.
   *
   * - Valida la firma (x-signature) si hay secret configurado.
   * - Responde 200 ante duplicados para que MP no siga reintentando.
   * - Nunca confía en el cuerpo: consulta la Order en MP antes de actualizar.
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const nestedData = query.data as { id?: unknown } | undefined;

    const dataId = String(
      query['data.id'] ?? nestedData?.id ?? req.body?.data?.id ?? ''
    ).trim();

    // Sin id de recurso no hay nada que procesar: se confirma la recepción.
    if (!dataId) {
      return res.status(200).json({ received: true });
    }

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (secret) {
      const valid = verifyMercadoPagoSignature({
        xSignature: req.headers['x-signature'] as string | undefined,
        xRequestId: req.headers['x-request-id'] as string | undefined,
        dataId,
        secret,
      });
      if (!valid) {
        console.warn('[MP] Firma de webhook inválida');
        return res.status(401).json({ received: false });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // En producción no se acepta un webhook sin verificar la firma.
      console.error('[MP] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción');
      return res.status(500).json({ received: false });
    } else {
      console.warn('[MP] Sin MERCADOPAGO_WEBHOOK_SECRET: se omite la validación (solo desarrollo)');
    }

    try {
      await PaymentsService.reconcilePaymentFromMercadoPago(dataId);
    } catch (err) {
      console.error('[MP] Error procesando webhook:', (err as Error)?.message);
      // 500 hace que Mercado Pago reintente la notificación.
      return res.status(500).json({ received: false });
    }

    return res.status(200).json({ received: true });
  });
}
