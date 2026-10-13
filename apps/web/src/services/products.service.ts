import apiClient from './api';
import { Product } from '@/types';
import { fetchAdminProducts, createProduct, updateProduct, toggleProductActive, deleteProduct } from './admin.service';

export const productsService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Product | null> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data || null;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await apiClient.get(`/products/category/${category}`);
    return response.data.data || [];
  },

  getAllAdmin: () => fetchAdminProducts(),

  create: (data: any) => createProduct(data),

  update: (id: string, data: any) => updateProduct(id, data),

  toggleActive: (id: string) => toggleProductActive(id),

  delete: (id: string) => deleteProduct(id),
};
