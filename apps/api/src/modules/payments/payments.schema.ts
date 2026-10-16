import { z } from 'zod';

export const CreateCheckoutSchema = z.object({
  orderId: z.string().min(1, 'El id del pedido es requerido'),
});
