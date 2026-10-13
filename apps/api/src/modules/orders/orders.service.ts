import { Order, IOrder } from './orders.model';
import { CouponsService } from '../coupons/coupons.service';
import { ConfigService } from '../config/config.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProductModel } from '../products/products.model';
import { CategoriaModel } from '../categories/categories.model';
import { AdicionalModel } from '../additionals/additionals.model';
import { CreateOrderInput } from './orders.schema';
import { AppError } from '../../utils/appError';
import { ORDER_STATUSES, OrderStatus } from '../../constants';

export const OrdersService = {
  createOrder: async (orderData: CreateOrderInput): Promise<IOrder> => {
    const storeStatus = await ConfigService.getStatus();
    if (!ConfigService.isOpenNow(storeStatus)) {
      throw new AppError('El local está cerrado en este momento', 400);
    }

    let subtotal = 0;
    const validatedItems = [];
    const stockDecrements: { productId: string; quantity: number }[] = [];

    for (const item of orderData.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product || !product.active) {
        throw new AppError('Uno de los productos no está disponible', 400);
      }

      const category = await CategoriaModel.findById(product.category);
      if (!category || !category.active) {
        throw new AppError('Uno de los productos no está disponible', 400);
      }

      if (product.controlStock) {
        if (product.stock <= 0) {
          throw new AppError(`El producto "${product.title}" se encuentra agotado`, 400);
        }
        if (item.quantity > product.stock) {
          throw new AppError(
            `Stock insuficiente para "${product.title}". Disponibles: ${product.stock}, solicitados: ${item.quantity}`,
            400
          );
        }
        stockDecrements.push({ productId: product._id.toString(), quantity: item.quantity });
      }

      const itemPrice = product.price * item.quantity;
      let addonsPrice = 0;
      const additionals = [];

      for (const addon of item.additionals || []) {
        const adicional = await AdicionalModel.findById(addon.addonId);
        if (!adicional || !adicional.active) {
          throw new AppError('Uno de los adicionales no está disponible', 400);
        }
        addonsPrice += adicional.price * addon.quantity;
        additionals.push({
          addonId: adicional._id.toString(),
          name: adicional.title,
          price: adicional.price,
          quantity: addon.quantity,
        });
      }

      subtotal += itemPrice + addonsPrice;

      validatedItems.push({
        productId: product._id.toString(),
        title: product.title,
        price: product.price,
        quantity: item.quantity,
        additionals,
      });
    }

    let discountPercent = 0;
    let discountAmount = 0;

    if (orderData.couponCode) {
      try {
        const coupon = await CouponsService.validateCoupon(
          orderData.couponCode,
          orderData.paymentMethod
        );
        discountPercent = coupon.discountPercent || 0;
        discountAmount = (subtotal * discountPercent) / 100;
      } catch (error: any) {
        throw new AppError(`Cupón inválido: ${error.message}`, 400);
      }
    }

    let deliveryCost = 0;
    let delivery = undefined;

    if (orderData.deliveryType === 'delivery') {
      delivery = {
        address: orderData.deliveryAddress || undefined,
      };
    }

    const total = subtotal - discountAmount + deliveryCost;

    if (stockDecrements.length > 0) {
      for (const dec of stockDecrements) {
        const product = await ProductModel.findById(dec.productId);
        if (!product || !product.controlStock) continue;

        const result = await ProductModel.updateOne(
          { _id: product._id, stock: { $gte: dec.quantity } },
          { $inc: { stock: -dec.quantity } }
        );

        if (result.modifiedCount === 0) {
          const fresh = await ProductModel.findById(dec.productId);
          const available = fresh?.stock ?? 0;
          throw new AppError(
            `Stock insuficiente para "${product.title}". Disponibles: ${available}, solicitados: ${dec.quantity}`,
            400
          );
        }
      }
    }

    const order = await Order.create({
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
      },
      items: validatedItems,
      deliveryType: orderData.deliveryType,
      paymentMethod: orderData.paymentMethod,
      couponCode: orderData.couponCode || null,
      discountPercent,
      subtotal,
      deliveryCost,
      total,
      status: 'pending',
      delivery,
    });

    await AnalyticsService.registerOrderCreated(order);

    return order;
  },

  viewAll: async (filters: Record<string, any> = {}): Promise<IOrder[]> => {
    return await Order.find(filters).sort({ createdAt: -1 }).lean();
  },

  viewById: async (id: string): Promise<IOrder | null> => {
    return await Order.findById(id);
  },

  // ================================================================
  // ⚠️ EN REVISIÓN (PENDIENTE — no cableado a ninguna ruta)
  // modify(): update genérico de una orden (Partial<IOrder>).
  // Si se usa, cablear a un PUT /admin/:id con schema que limite
  // qué campos se pueden tocar (no status/total/subtotal sueltos).
  // Revisar más adelante. Ver CHECKLIST_BLOQUE4_REVISION.txt.
  // ================================================================
  // modify: async (id: string, updateData: Partial<IOrder>): Promise<IOrder | null> => {
  //   return await Order.findByIdAndUpdate(id, updateData, { new: true });
  // },

  updateStatus: async (id: string, status: string): Promise<IOrder | null> => {
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new AppError('Estado inválido', 400);
    }

    const oldOrder = await Order.findById(id);
    if (!oldOrder) return null;
    const oldStatus = oldOrder.status;

    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (updated) {
      if (oldStatus !== 'delivered' && status === 'delivered') {
        await AnalyticsService.registerDelivery(updated);
      } else if (oldStatus === 'delivered' && status !== 'delivered') {
        await AnalyticsService.revertDelivery(updated);
      }

      if (oldStatus !== 'cancelled' && status === 'cancelled') {
        for (const item of oldOrder.items) {
          const product = await ProductModel.findById(item.productId);
          if (product && product.controlStock) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    return updated;
  },

  deleteById: async (id: string): Promise<boolean> => {
    const order = await Order.findById(id);
    if (order && order.status !== 'cancelled') {
      for (const item of order.items) {
        const product = await ProductModel.findById(item.productId);
        if (product && product.controlStock) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    const result = await Order.findByIdAndDelete(id);
    return !!result;
  },

  countByStatus: async (status: OrderStatus): Promise<number> => {
    return await Order.countDocuments({ status });
  },

  updateDeliveryCost: async (id: string, deliveryCost: number): Promise<IOrder | null> => {
    const order = await Order.findById(id);
    if (!order) return null;
    if (typeof deliveryCost !== 'number' || deliveryCost < 0) {
      throw new AppError('El costo de envío debe ser un número positivo', 400);
    }

    const newTotal = order.subtotal - (order.subtotal * order.discountPercent) / 100 + deliveryCost;

    return await Order.findByIdAndUpdate(
      id,
      { deliveryCost, total: newTotal },
      { new: true }
    );
  },
};
