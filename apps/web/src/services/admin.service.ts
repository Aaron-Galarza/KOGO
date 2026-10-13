import apiClient from './api';

export type AdminRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

// Deduplicación de requests en vuelo: evita llamadas HTTP duplicadas cuando
// varios componentes montan a la vez y piden los mismos datos.
let productsPromise: Promise<any> | null = null;
let categoriesPromise: Promise<any> | null = null;
let addonsPromise: Promise<any> | null = null;

// ── Products ──────────────────────────────────────────────────────────────────
export const fetchAdminProducts = () => {
  if (!productsPromise) {
    productsPromise = apiClient.get('/products/admin/all')
      .then((r) => r.data.data)
      .finally(() => { productsPromise = null; });
  }
  return productsPromise;
};

export const createProduct = (payload: Record<string, any>) =>
  apiClient.post('/products/admin', payload).then((r) => r.data.data);

export const updateProduct = (id: string, payload: Record<string, any>) =>
  apiClient.put(`/products/admin/${id}`, payload).then((r) => r.data.data);

export const toggleProductActive = (id: string) =>
  apiClient.patch(`/products/admin/${id}/toggle`).then((r) => r.data.data);

export const deleteProduct = (id: string) =>
  apiClient.delete(`/products/admin/${id}`).then((r) => r.data.data);

// ── Categories ───────────────────────────────────────────────────────────────
export const fetchAdminCategories = () => {
  if (!categoriesPromise) {
    categoriesPromise = apiClient.get('/categories/admin/all')
      .then((r) => r.data.data)
      .finally(() => { categoriesPromise = null; });
  }
  return categoriesPromise;
};

export const createCategory = (payload: Record<string, any>) =>
  apiClient.post('/categories/admin', payload).then((r) => r.data.data);

export const updateCategory = (id: string, payload: Record<string, any>) =>
  apiClient.put(`/categories/admin/${id}`, payload).then((r) => r.data.data);

export const toggleCategoryActive = (id: string) =>
  apiClient.patch(`/categories/admin/${id}/toggle`).then((r) => r.data.data);

export const deleteCategory = (id: string) =>
  apiClient.delete(`/categories/admin/${id}`).then((r) => r.data.data);

// ── Additionals ──────────────────────────────────────────────────────────────
export const fetchAdminAddons = () => {
  if (!addonsPromise) {
    addonsPromise = apiClient.get('/additionals/admin/all')
      .then((r) => r.data.data)
      .finally(() => { addonsPromise = null; });
  }
  return addonsPromise;
};

export const createAddon = (payload: Record<string, any>) =>
  apiClient.post('/additionals/admin', payload).then((r) => r.data.data);

export const updateAddon = (id: string, payload: Record<string, any>) =>
  apiClient.put(`/additionals/admin/${id}`, payload).then((r) => r.data.data);

export const toggleAddonActive = (id: string) =>
  apiClient.patch(`/additionals/admin/${id}/toggle`).then((r) => r.data.data);

export const deleteAddon = (id: string) =>
  apiClient.delete(`/additionals/admin/${id}`).then((r) => r.data.data);

// ── Orders ───────────────────────────────────────────────────────────────────
export const fetchAdminOrders = (status?: string, range?: string, customFrom?: string, customTo?: string) => {
  const params: any = {};
  if (status) params.status = status;
  if (range === 'custom') {
    if (customFrom) params.from = customFrom;
    if (customTo) params.to = customTo;
  } else if (range && range !== 'all') {
    params.range = range;
  }
  return apiClient.get('/orders/admin', { params }).then((r) => r.data.data.orders || []);
};

export const updateOrderStatus = (id: string, status: string) =>
  apiClient.patch(`/orders/admin/${id}/status`, { status }).then((r) => r.data.data);

export const updateOrderDeliveryCost = (id: string, deliveryCost: number) =>
  apiClient.put(`/orders/admin/${id}/delivery-cost`, { deliveryCost }).then((r) => r.data.data);

export const deleteOrder = (id: string) =>
  apiClient.delete(`/orders/admin/${id}`).then((r) => r.data.data);

export const fetchOrderStats = () =>
  apiClient.get('/orders/admin/stats').then((r) => r.data.data);

// ── Coupons ──────────────────────────────────────────────────────────────────
export const fetchAdminCoupons = () =>
  apiClient.get('/coupons/admin').then((r) => r.data.data);

export const createCoupon = (payload: Record<string, any>) =>
  apiClient.post('/coupons/admin', payload).then((r) => r.data.data);

export const updateCoupon = (id: string, payload: Record<string, any>) =>
  apiClient.put(`/coupons/admin/${id}`, payload).then((r) => r.data.data);

export const toggleCouponActive = (id: string) =>
  apiClient.patch(`/coupons/admin/${id}/toggle`).then((r) => r.data.data);

export const deleteCoupon = (id: string) =>
  apiClient.delete(`/coupons/admin/${id}`).then((r) => r.data.data);

// ── Banners ──────────────────────────────────────────────────────────────────
export const fetchAdminBanners = () =>
  apiClient.get('/banners/admin/all').then((r) => r.data.data);

export const createBanner = (payload: Record<string, any>) =>
  apiClient.post('/banners/admin', payload).then((r) => r.data.data);

export const updateBanner = (id: string, payload: Record<string, any>) =>
  apiClient.put(`/banners/admin/${id}`, payload).then((r) => r.data.data);

export const toggleBannerActive = (id: string) =>
  apiClient.patch(`/banners/admin/${id}/toggle`).then((r) => r.data.data);

export const deleteBanner = (id: string) =>
  apiClient.delete(`/banners/admin/${id}`).then((r) => r.data.data);

// ── Config ───────────────────────────────────────────────────────────────────
export const fetchConfigStatus = () =>
  apiClient.get('/config/status').then((r) => r.data.data);

export const toggleEmergency = () =>
  apiClient.patch('/config/emergency').then((r) => r.data.data);

export const saveSchedule = (dailySchedule: any[]) =>
  apiClient.put('/config/schedule', { dailySchedule }).then((r) => r.data.data);

export const saveBanner = (banner: string) =>
  apiClient.put('/config/banner', { banner }).then((r) => r.data.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const fetchAnalyticsStats = (range: AdminRange = 'today', customFrom?: string, customTo?: string) => {
  const params: any = {};
  if (range === 'custom' && customFrom && customTo) {
    params.from = customFrom;
    params.to = customTo;
  } else {
    params.range = range;
  }
  return apiClient.get('/analytics/admin', { params }).then((r) => r.data.data);
};

export const fetchAnalyticsOrders = (range: AdminRange = 'today', paymentFilter = '', customFrom?: string, customTo?: string) => {
  const params: any = { status: 'delivered' };
  if (paymentFilter) params.paymentMethod = paymentFilter;
  if (range === 'custom') {
    if (customFrom) params.from = customFrom;
    if (customTo) params.to = customTo;
  } else if (range !== 'all') {
    params.range = range;
  }
  return apiClient.get('/orders/admin', { params }).then((r) => ({ orders: r.data.data.orders || [], total: r.data.data.total ?? 0 }));
};

// ── Gallery ───────────────────────────────────────────────────────────────────
export const fetchGalleryImages = () =>
  apiClient.get('/gallery').then((r) => r.data.data);

export const uploadGalleryImage = (formData: FormData) =>
  apiClient.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);

export const deleteGalleryImage = (imageId: string) =>
  apiClient.delete(`/gallery/${imageId}`).then((r) => r.data.data);