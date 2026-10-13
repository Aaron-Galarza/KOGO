import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS, DELIVERY_TYPES } from '../../constants';

const AdditionalItemSchema = z.object({
  addonId: z.string().min(1, 'El id del adicional es requerido'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
});

const OrderItemSchema = z.object({
  productId: z.string().min(1, 'El id del producto es requerido'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  additionals: z.array(AdditionalItemSchema).optional().default([]),
});

export const CreateOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'El nombre debe tener mínimo 2 caracteres').max(100),
    phone: z
      .string()
      .max(20, 'El teléfono es demasiado largo')
      .refine(
        (value) => value === '00' || value.replace(/\D/g, '').length >= 10,
        'El teléfono debe tener mínimo 10 dígitos'
      ),
  }),
  items: z.array(OrderItemSchema).min(1, 'Debe haber al menos un artículo'),
  deliveryType: z.enum(DELIVERY_TYPES, {
    error: 'Tipo de entrega inválido',
  }),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    error: 'Método de pago inválido',
  }),
  couponCode: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.deliveryType === 'delivery') {
      return !!data.deliveryAddress && data.deliveryAddress.trim().length > 0;
    }
    return true;
  },
  {
    message: 'La dirección es requerida cuando el tipo de envío es delivery',
    path: ['deliveryAddress'],
  }
);

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'Estado inválido' }),
});

export const UpdateDeliveryCostSchema = z.object({
  deliveryCost: z.number().min(0, 'El costo de envío no puede ser negativo'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
export type UpdateDeliveryCost = z.infer<typeof UpdateDeliveryCostSchema>;
