import apiClient from './api';
import { Coupon } from '@/types';
import { fetchAdminCoupons, createCoupon, updateCoupon, toggleCouponActive, deleteCoupon } from './admin.service';

export const couponsService = {
  validateCoupon: async (code: string, paymentMethod?: string): Promise<Coupon> => {
    const response = await apiClient.post('/coupons/validate', { code: code.toUpperCase(), paymentMethod }).catch((err: any) => {
      throw new Error(err.response?.data?.error || 'Cupon invalido');
    });
    return response.data.data;
  },

  getAll: () => fetchAdminCoupons(),
  create: (data: any) => createCoupon(data),
  update: (id: string, data: any) => updateCoupon(id, data),
  delete: (id: string) => deleteCoupon(id),
  toggle: (id: string) => toggleCouponActive(id),
};
