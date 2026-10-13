import apiClient from './api';
import { Category } from '@/types';
import { fetchAdminCategories, createCategory, updateCategory, toggleCategoryActive, deleteCategory } from './admin.service';

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data.data || [];
  },
  getAllAdmin: () => fetchAdminCategories(),
  create: (data: any) => createCategory(data),
  update: (id: string, data: any) => updateCategory(id, data),
  toggleActive: (id: string) => toggleCategoryActive(id),
  delete: (id: string) => deleteCategory(id),
};
