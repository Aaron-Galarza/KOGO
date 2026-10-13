import apiClient from './api';
import { Order } from '@/types';
import { fetchAdminOrders, updateOrderStatus, updateOrderDeliveryCost, deleteOrder, fetchOrderStats } from './admin.service';

export const ordersService = {
  createOrder: async (orderData: any): Promise<Order> => {
    const response = await apiClient.post('/orders', orderData).catch((err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al crear la orden';
      throw new Error(msg);
    });
    return (response as any).data.data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data;
  },

  getComanda: async (orderId: string): Promise<string> => {
    const response = await apiClient.get(`/orders/${orderId}/comanda`);
    return response.data.data.comanda;
  },

  getOrders: (status?: string, range?: string, customFrom?: string, customTo?: string) =>
    fetchAdminOrders(status, range, customFrom, customTo),

  updateOrderStatus: (orderId: string, status: string) => updateOrderStatus(orderId, status),

  deleteOrder: (orderId: string) => deleteOrder(orderId),

  updateDeliveryCost: (orderId: string, deliveryCost: number) => updateOrderDeliveryCost(orderId, deliveryCost),

  getStats: () => fetchOrderStats(),
};
