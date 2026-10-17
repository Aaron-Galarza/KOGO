import apiClient from './api';
import { Product, Category, Addon, StoreConfig, Banner } from '@/types';

const cache = new Map<string, { data: unknown; ts: number }>();

// Cachés cortas a propósito: el admin cambia cosas operativas (precios,
// disponibilidad, adicionales, franjas) y no queremos mostrar datos viejos
// durante minutos. El estado de la tienda no se cachea nunca (ver abajo).
const TTL_CATALOG = 10_000;
const TTL_ADDONS = 20_000;

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
    cached('products', TTL_CATALOG, () =>
      apiClient.get('/products').then((r) => r.data.data || [])
    ),

  getProductDetail: (id: string): Promise<Product> =>
    cached(`product-${id}`, TTL_CATALOG, () =>
      apiClient.get(`/products/${id}`).then((r) => r.data.data)
    ),

  getCategories: (): Promise<Category[]> =>
    cached('categories', TTL_CATALOG, () =>
      apiClient.get('/categories').then((r) => r.data.data || [])
    ),

  getAdditionals: (): Promise<Addon[]> =>
    cached('additionals', TTL_ADDONS, () =>
      apiClient.get('/additionals').then((r) => r.data.data || [])
    ),

  // Sin caché: si el admin abre/cierra la tienda o cambia horarios, tiene que
  // verse al instante (el cartel de abierto/cerrado y el bloqueo de pedidos).
  getStoreStatus: (): Promise<StoreConfig> =>
    apiClient.get('/config/status').then((r) => r.data.data),

  getBanners: (): Promise<Banner[]> =>
    cached('banners', TTL_CATALOG, () =>
      apiClient.get('/banners').then((r) => r.data.data || []).catch(() => [] as Banner[])
    ),
};
