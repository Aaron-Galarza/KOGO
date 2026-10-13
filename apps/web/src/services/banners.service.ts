import apiClient from './api';
import { Banner } from '@/types';
import { fetchAdminBanners, createBanner, updateBanner, toggleBannerActive, deleteBanner } from './admin.service';

export const bannersService = {
  getActive: async (): Promise<Banner[]> => {
    const response = await apiClient.get('/banners');
    return response.data.data || [];
  },

  getAll: () => fetchAdminBanners(),
  create: (data: any) => createBanner(data),
  update: (id: string, data: any) => updateBanner(id, data),
  toggleActive: (id: string) => toggleBannerActive(id),
  delete: (id: string) => deleteBanner(id),
};
