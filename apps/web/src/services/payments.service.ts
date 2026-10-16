import apiClient from './api';

export type PaymentStatusValue =
  | 'not_required'
  | 'pending'
  | 'in_process'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export interface PaymentStatus {
  orderId: string;
  paymentMethod: string;
  paymentStatus: PaymentStatusValue;
  orderStatus: string;
  total: number;
}

export interface CheckoutResult {
  checkoutUrl: string;
  paymentId: string;
}

interface ApiErrorShape {
  response?: { data?: { error?: string; message?: string } };
}

export const paymentsService = {
  // Inicia el pago online de un pedido y devuelve la URL del checkout de Mercado Pago.
  createCheckout: async (orderId: string): Promise<CheckoutResult> => {
    const response = await apiClient.post('/payments/checkout', { orderId }).catch((err: unknown) => {
      const { response } = err as ApiErrorShape;
      const msg = response?.data?.error || response?.data?.message || 'No se pudo iniciar el pago';
      throw new Error(msg);
    });
    return response.data.data as CheckoutResult;
  },

  // Estado de pago informado por el backend (fuente de verdad; NO confirma por sí solo).
  getStatus: async (orderId: string): Promise<PaymentStatus> => {
    const response = await apiClient.get(`/payments/orders/${orderId}/status`);
    return response.data.data;
  },
};
