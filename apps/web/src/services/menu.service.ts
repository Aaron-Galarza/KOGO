import apiClient from './api';
import { Product, Category, Addon, StoreConfig, Banner } from '@/types';

const cache = new Map<string, { data: any; ts: number }>();
const TTL_SHORT = 30_000;
const TTL_LONG = 120_000;

function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttl) {
    return Promise.resolve(entry.data as T);
  }
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

export const menuService = {
  getProducts: (): Promise<Product[]> =>
    cached('products', TTL_SHORT, () =>
      apiClient.get('/products').then((r) => r.data.data || [])
    ),

  getCategories: (): Promise<Category[]> =>
    cached('categories', TTL_SHORT, () =>
      apiClient.get('/categories').then((r) => r.data.data || [])
    ),

  getAdditionals: (): Promise<Addon[]> =>
    cached('additionals', TTL_LONG, () =>
      apiClient.get('/additionals').then((r) => r.data.data || [])
    ),

  getStoreStatus: (): Promise<StoreConfig> =>
    cached('store-status', TTL_LONG, () =>
      apiClient.get('/config/status').then((r) => r.data.data)
    ),

  getBanners: (): Promise<Banner[]> =>
    cached('banners', TTL_SHORT, () =>
      apiClient.get('/banners').then((r) => r.data.data || []).catch(() => [] as Banner[])
    ),
};
