import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';
import { ORDER_STATUSES, PAYMENT_METHODS, DATE_RANGES, DateRange } from '../../constants';
import { getRangeStartDate } from '../../utils/dateRange';
import { arDayRange } from '../../utils/argentinaTime';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class OrdersController {
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const order = await OrdersService.createOrder(req.body);

    if (globalThis.io) {
      globalThis.io.to('kitchen').emit('order-created', order);
    }

    sendSuccess(res, order, 201, 'Orden creada exitosamente');
  });

  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await OrdersService.viewById(id);
    if (!order) {
      return sendError(res, 'Orden no encontrada', 404);
    }
    sendSuccess(res, order);
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { status, paymentMethod, range, from, to } = req.query;
    const filter: Record<string, any> = {};

    if (status) {
      const statuses = String(status)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => (ORDER_STATUSES as readonly string[]).includes(s));
      if (statuses.length > 0) {
        filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
      }
    }

    if (paymentMethod) {
      if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod as string)) {
        return sendError(res, 'Método de pago inválido', 400);
      }
      filter.paymentMethod = paymentMethod;
    }

    if (range) {
      if (!(DATE_RANGES as readonly string[]).includes(range as string)) {
        return sendError(res, 'Rango inválido', 400);
      }
      const { start, end } = getRangeStartDate(range as DateRange);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (from || to) {
      if (!from || !to || !DATE_REGEX.test(from as string) || !DATE_REGEX.test(to as string)) {
        return sendError(res, "Debe indicar 'from' y 'to' en formato YYYY-MM-DD", 400);
      }
      const { start } = arDayRange(from as string);
      const { end } = arDayRange(to as string);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await OrdersService.viewAll(filter);
    const reportOrders = orders.map((o: any) => ({
      ...o,
      netTotal: (o.total ?? 0) - (o.deliveryCost ?? 0),
    }));
    const total = reportOrders.reduce((s: number, o: any) => s + (o.netTotal ?? 0), 0);

    sendSuccess(res, { orders: reportOrders, total, count: orders.length }, 200);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const order = await OrdersService.viewById(id);

    if (!order) {
      return sendError(res, 'Orden no encontrada', 404);
    }

    sendSuccess(res, order, 200);
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'El estado es requerido', 400);
    }

    try {
      const order = await OrdersService.updateStatus(id, status);

      if (!order) {
        return sendError(res, 'Orden no encontrada', 404);
      }

      // Emitir evento a través de Socket.IO
      if (globalThis.io) {
        globalThis.io.to('kitchen').emit('order-updated', {
          orderId: order._id,
          status: order.status,
          customer: order.customer.name,
        });
      }

      sendSuccess(res, order, 200, 'Estado actualizado');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const deleted = await OrdersService.deleteById(id);

    if (!deleted) {
      return sendError(res, 'Orden no encontrada', 404);
    }

    // Emitir evento de eliminación
    if (globalThis.io) {
      globalThis.io.to('kitchen').emit('order-deleted', {
        orderId: id,
      });
    }

    sendSuccess(res, { id }, 200, 'Orden eliminada');
  });

  static updateDeliveryCost = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { deliveryCost } = req.body;

    const order = await OrdersService.updateDeliveryCost(id, deliveryCost);
    if (!order) {
      return sendError(res, 'Orden no encontrada', 404);
    }
    sendSuccess(res, order, 200, 'Costo de envío actualizado');
  });

  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const counts = await Promise.all(
      ORDER_STATUSES.map((status) => OrdersService.countByStatus(status))
    );

    const stats: Record<string, number> = {};
    for (let i = 0; i < ORDER_STATUSES.length; i++) {
      stats[ORDER_STATUSES[i]] = counts[i];
    }

    sendSuccess(res, stats, 200);
  });
}
