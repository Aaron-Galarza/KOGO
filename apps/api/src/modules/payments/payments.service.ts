import crypto from 'crypto';
import mongoose from 'mongoose';
import { Order } from '../orders/orders.model';
import { OrdersService } from '../orders/orders.service';
import { PaymentModel } from './payments.model';
import { MercadoPagoClient } from './mercadopago.client';
import {
  buildMercadoPagoItems,
  mapMercadoPagoStatus,
  canTransitionPaymentStatus,
  isApprovalConsistent,
} from './payments.utils';
import { verifyMercadoPagoSignature } from './payments.webhook';
import { AppError } from '../../utils/appError';
import { MERCADOPAGO_CURRENCY, PAYMENT_CHECKOUT_TTL_MINUTES, PaymentStatus } from '../../constants';

export const PaymentsService = {
  /**
   * Inicia el pago online de un pedido existente y devuelve la URL de checkout.
   * El importe se toma SIEMPRE del pedido guardado (el navegador nunca decide el precio).
   * Es idempotente: reutiliza un checkout pendiente vigente del mismo pedido.
   */
  createCheckout: async (
    orderId: string
  ): Promise<{ checkoutUrl: string; paymentId: string }> => {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError('Pedido inválido', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }
    if (order.paymentMethod !== 'mercadopago') {
      throw new AppError('Este pedido no es de pago online', 400);
    }
    if (order.status === 'cancelled') {
      throw new AppError('El pedido está cancelado', 400);
    }

    const approved = await PaymentModel.findOne({ orderId: order._id, status: 'approved' });
    if (approved) {
      throw new AppError('El pedido ya está pagado', 409);
    }

    // Idempotencia: si ya hay un checkout pendiente y vigente, se reutiliza.
    const pending = await PaymentModel.findOne({
      orderId: order._id,
      status: { $in: ['pending', 'in_process'] },
      checkoutUrl: { $ne: null },
    }).sort({ createdAt: -1 });

    if (pending?.checkoutUrl) {
      const ageMinutes = (Date.now() - pending.createdAt.getTime()) / 60000;
      if (ageMinutes < PAYMENT_CHECKOUT_TTL_MINUTES) {
        return { checkoutUrl: pending.checkoutUrl, paymentId: pending._id.toString() };
      }
    }

    if (order.total <= 0) {
      throw new AppError('El total a pagar debe ser mayor a 0', 400);
    }

    const idempotencyKey = crypto.randomUUID();
    const items = buildMercadoPagoItems(order.items, order.total);

    // URLs de retorno del checkout. Solo se envían si hay una URL pública
    // configurada (en local no tiene sentido que MP redirija a localhost).
    const appUrl = (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, '');
    const backUrls = appUrl
      ? {
          successUrl: `${appUrl}/pago/aprobado`,
          pendingUrl: `${appUrl}/pago/pendiente`,
          failureUrl: `${appUrl}/pago/error`,
        }
      : undefined;

    let mp;
    try {
      mp = await MercadoPagoClient.createOrder(
        {
          externalReference: order._id.toString(),
          totalAmount: order.total,
          description: `Pedido KOGO ${order._id.toString().slice(-6).toUpperCase()}`,
          items,
          backUrls,
        },
        idempotencyKey
      );
    } catch (error: any) {
      // Log sin secretos: solo estado HTTP y mensaje.
      console.error(
        `[MP] Error al crear checkout del pedido ${order._id.toString()}:`,
        error?.response?.status,
        error?.message
      );
      throw new AppError('No se pudo iniciar el pago. Intentá de nuevo.', 502);
    }

    if (!mp.checkoutUrl) {
      throw new AppError('Mercado Pago no devolvió una URL de checkout', 502);
    }

    const payment = await PaymentModel.create({
      orderId: order._id,
      provider: 'mercadopago',
      mpOrderId: mp.id,
      externalReference: order._id.toString(),
      idempotencyKey,
      amount: order.total,
      currency: MERCADOPAGO_CURRENCY,
      status: 'pending',
      statusDetail: mp.statusDetail ?? null,
      checkoutUrl: mp.checkoutUrl,
    });

    if (order.paymentStatus !== 'pending' && order.paymentStatus !== 'in_process') {
      order.paymentStatus = 'pending';
      await order.save();
    }

    return { checkoutUrl: mp.checkoutUrl, paymentId: payment._id.toString() };
  },

  /** Estado de pago mínimo para la página de retorno (NO confirma nada por sí solo). */
  getPaymentStatus: async (orderId: string) => {
    if (!mongoose.isValidObjectId(orderId)) {
      throw new AppError('Pedido inválido', 400);
    }

    const order = await Order.findById(orderId).select(
      'paymentMethod paymentStatus status total'
    );
    if (!order) {
      throw new AppError('Pedido no encontrado', 404);
    }

    return {
      orderId: order._id.toString(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      total: order.total,
    };
  },

  /**
   * Libera el stock de pedidos online sin pagar tras PAYMENT_CHECKOUT_TTL_MINUTES.
   * Cancela el pedido (lo que devuelve el stock) y marca los pagos como cancelados.
   *
   * Solo aplica a pedidos NO acreditados: un pago aprobado o reembolsado nunca
   * se cancela por este barrido.
   */
  sweepExpiredCheckouts: async (): Promise<number> => {
    const cutoff = new Date(Date.now() - PAYMENT_CHECKOUT_TTL_MINUTES * 60 * 1000);

    const expired = await Order.find({
      paymentMethod: 'mercadopago',
      paymentStatus: { $nin: ['approved', 'refunded', 'not_required'] },
      status: 'pending',
      createdAt: { $lt: cutoff },
    }).select('_id');

    for (const order of expired) {
      try {
        await OrdersService.updateStatus(order._id.toString(), 'cancelled');
        await Order.findByIdAndUpdate(order._id, { paymentStatus: 'cancelled' });
        await PaymentModel.updateMany(
          { orderId: order._id, status: { $nin: ['approved', 'refunded'] } },
          { status: 'cancelled' }
        );
      } catch (error: any) {
        console.error(
          `[MP] Error al expirar el pedido ${order._id.toString()}:`,
          error?.message
        );
      }
    }

    return expired.length;
  },

  /**
   * Procesa una notificación (webhook) de Mercado Pago.
   *
   * Flujo: consulta la Order en MP (nunca confía en el body), valida que el
   * pago coincida con el pedido local, y actualiza de forma idempotente.
   * Responde igual ante duplicados: aplicar dos veces el mismo evento es seguro.
   */
  processWebhook: async (mpOrderId: string): Promise<void> => {
    const mp = await MercadoPagoClient.getOrder(mpOrderId);

    // Buscar el pago local por id de MP o, si no, por la referencia externa.
    const payment =
      (await PaymentModel.findOne({ mpOrderId: mp.id })) ||
      (mp.externalReference
        ? await PaymentModel.findOne({ externalReference: mp.externalReference })
        : null);

    if (!payment) {
      console.warn(`[MP] Webhook para una orden desconocida: ${mp.id}`);
      return;
    }

    let nextStatus: PaymentStatus = mapMercadoPagoStatus(mp.status, mp.statusDetail);

    // Nunca acreditar si el importe/moneda/referencia no coinciden.
    if (nextStatus === 'approved') {
      const consistent = isApprovalConsistent({
        expectedAmount: payment.amount,
        expectedReference: payment.externalReference,
        expectedCurrency: payment.currency,
        receivedAmount: mp.totalAmount,
        receivedReference: mp.externalReference,
        receivedCurrency: mp.currencyId,
      });

      if (!consistent) {
        console.error(
          `[MP] Pago ${mp.id} NO coincide con el pedido ${payment.externalReference}; no se acredita.`
        );
        nextStatus = 'in_process';
      }
    }

    // Actualizar el pago local (anti-regresión + idempotencia).
    if (canTransitionPaymentStatus(payment.status, nextStatus)) {
      payment.status = nextStatus;
      payment.statusDetail = mp.statusDetail ?? payment.statusDetail ?? null;
      await payment.save();
    }

    const order = await Order.findById(payment.orderId);
    if (!order) return;

    if (canTransitionPaymentStatus(order.paymentStatus, nextStatus)) {
      order.paymentStatus = nextStatus;
      await order.save();
    }
  },
};
