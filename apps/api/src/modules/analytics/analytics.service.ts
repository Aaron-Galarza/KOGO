import { OrderDailyStats, IProductDailyStat, IProductAddonStat } from './analytics.model';
import { IOrder } from '../orders/orders.model';
import { getRangeStartDate } from '../../utils/dateRange';
import { arDateKey } from '../../utils/argentinaTime';
import { DateRange } from '../../constants';

export interface GetStatsParams {
  range?: DateRange;
  from?: string;
  to?: string;
}

export interface AddonStatOutput {
  title: string;
  qty: number;
  revenue: number;
}

export interface ProductStatOutput {
  title: string;
  qty: number;
  revenue: number;
  discount: number;
  net: number;
  addons: AddonStatOutput[];
}

export interface GetStatsResult {
  ordersCount: number;
  completedOrders: number;
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  avgTicket: number;
  totalDiscounts: number;
  products: ProductStatOutput[];
  topProduct: ProductStatOutput | null;
}

const dateKey = (date: Date): string => arDateKey(date);

const productKey = (title: string): string => Buffer.from(title, 'utf-8').toString('base64');

const itemRevenue = (item: IOrder['items'][number]): number => {
  const addonsTotal = item.additionals.reduce((sum, a) => sum + a.price * a.quantity, 0);
  return item.price * item.quantity + addonsTotal;
};

export const AnalyticsService = {
  registerOrderCreated: async (order: IOrder): Promise<void> => {
    const date = dateKey(order.createdAt);
    await OrderDailyStats.findOneAndUpdate(
      { date },
      { $inc: { ordersCount: 1 } },
      { upsert: true }
    );
  },

  registerDelivery: async (order: IOrder): Promise<void> => {
    const date = dateKey(order.createdAt);
    const incUpdates: Record<string, number> = {};
    const setUpdates: Record<string, string> = {};
    const discountRatio = (order.discountPercent ?? 0) / 100;
    const salesTotal = (order.total ?? 0) - (order.deliveryCost ?? 0);

    for (const item of order.items) {
      const base = `products.${productKey(item.title)}`;
      const itemRev = itemRevenue(item);
      incUpdates[`${base}.qty`] = (incUpdates[`${base}.qty`] ?? 0) + item.quantity;
      incUpdates[`${base}.revenue`] = (incUpdates[`${base}.revenue`] ?? 0) + itemRev;
      incUpdates[`${base}.discount`] = (incUpdates[`${base}.discount`] ?? 0) + itemRev * discountRatio;
      setUpdates[`${base}.title`] = item.title;

      for (const addon of item.additionals || []) {
        const addonBase = `${base}.addons.${productKey(addon.name)}`;
        incUpdates[`${addonBase}.qty`] = (incUpdates[`${addonBase}.qty`] ?? 0) + addon.quantity;
        incUpdates[`${addonBase}.revenue`] =
          (incUpdates[`${addonBase}.revenue`] ?? 0) + addon.price * addon.quantity;
        setUpdates[`${addonBase}.title`] = addon.name;
      }
    }

    const totals: Record<string, number> = {
      completedOrders: 1,
      totalSales: salesTotal,
      ...incUpdates,
    };
    if (order.paymentMethod === 'cash') totals.totalCash = salesTotal;
    else if (order.paymentMethod === 'transfer') totals.totalTransfer = salesTotal;

    await OrderDailyStats.findOneAndUpdate(
      { date },
      {
        $inc: totals,
        $set: setUpdates,
      },
      { upsert: true }
    );
  },

  revertDelivery: async (order: IOrder): Promise<void> => {
    const date = dateKey(order.createdAt);
    const daily = await OrderDailyStats.findOne({ date });
    if (!daily) return;

    const incUpdates: Record<string, number> = {};
    const discountRatio = (order.discountPercent ?? 0) / 100;
    const salesTotal = (order.total ?? 0) - (order.deliveryCost ?? 0);

    for (const item of order.items) {
      const key = productKey(item.title);
      const base = `products.${key}`;
      const current = daily.products?.get(key);
      const currentQty = current?.qty ?? 0;
      const currentRevenue = current?.revenue ?? 0;
      const currentDiscount = current?.discount ?? 0;
      const itemRev = itemRevenue(item);

      incUpdates[`${base}.qty`] = (incUpdates[`${base}.qty`] ?? 0) - Math.min(item.quantity, currentQty);
      incUpdates[`${base}.revenue`] =
        (incUpdates[`${base}.revenue`] ?? 0) - Math.min(itemRev, currentRevenue);
      incUpdates[`${base}.discount`] =
        (incUpdates[`${base}.discount`] ?? 0) - Math.min(itemRev * discountRatio, currentDiscount);

      const currentAddons = current?.addons;
      for (const addon of item.additionals || []) {
        const addonKey = productKey(addon.name);
        const addonBase = `${base}.addons.${addonKey}`;
        const currentAddon =
          currentAddons instanceof Map
            ? currentAddons.get(addonKey)
            : (currentAddons as Record<string, IProductAddonStat> | undefined)?.[addonKey];
        const addonQty = currentAddon?.qty ?? 0;
        const addonRevenue = currentAddon?.revenue ?? 0;

        incUpdates[`${addonBase}.qty`] =
          (incUpdates[`${addonBase}.qty`] ?? 0) - Math.min(addon.quantity, addonQty);
        incUpdates[`${addonBase}.revenue`] =
          (incUpdates[`${addonBase}.revenue`] ?? 0) - Math.min(addon.price * addon.quantity, addonRevenue);
      }
    }

    const safeTotalSales = Math.min(salesTotal, daily.totalSales ?? 0);
    const safeCompleted = Math.min(1, daily.completedOrders ?? 0);

    const totals: Record<string, number> = {
      completedOrders: -safeCompleted,
      totalSales: -safeTotalSales,
      ...incUpdates,
    };
    if (order.paymentMethod === 'cash') {
      totals.totalCash = -Math.min(salesTotal, daily.totalCash ?? 0);
    } else if (order.paymentMethod === 'transfer') {
      totals.totalTransfer = -Math.min(salesTotal, daily.totalTransfer ?? 0);
    }

    await OrderDailyStats.findOneAndUpdate(
      { date },
      {
        $inc: totals,
      }
    );
  },

  getStats: async (params: GetStatsParams): Promise<GetStatsResult> => {
    let startKey: string;
    let endKey: string;

    if (params.range) {
      const { start, end } = getRangeStartDate(params.range);
      startKey = dateKey(start);
      endKey = dateKey(end);
    } else {
      startKey = params.from!;
      endKey = params.to!;
    }

    const dailies = await OrderDailyStats.find({
      date: { $gte: startKey, $lte: endKey },
    }).lean();

    let ordersCount = 0;
    let completedOrders = 0;
    let totalSales = 0;
    let totalCash = 0;
    let totalTransfer = 0;
    const productMap: Record<string, IProductDailyStat> = {};

    for (const day of dailies) {
      ordersCount += day.ordersCount ?? 0;
      completedOrders += day.completedOrders ?? 0;
      totalSales += day.totalSales ?? 0;
      totalCash += day.totalCash ?? 0;
      totalTransfer += day.totalTransfer ?? 0;

      const products = day.products;
      if (!products) continue;

      const entries = products instanceof Map ? [...products.entries()] : Object.entries(products);

      for (const [key, data] of entries) {
        const entry = data as IProductDailyStat;
        if (!productMap[key]) {
          productMap[key] = {
            title: entry.title || 'Sin nombre',
            qty: 0,
            revenue: 0,
            discount: 0,
            addons: new Map<string, IProductAddonStat>(),
          };
        }
        const acc = productMap[key];
        acc.qty += entry.qty ?? 0;
        acc.revenue += entry.revenue ?? 0;
        acc.discount += entry.discount ?? 0;

        const addons = entry.addons;
        if (!addons) continue;
        const addonEntries = addons instanceof Map ? [...addons.entries()] : Object.entries(addons);

        for (const [addonKey, addonData] of addonEntries) {
          const addon = addonData as IProductAddonStat;
          let existing = acc.addons.get(addonKey);
          if (!existing) {
            existing = { title: addon.title || addonKey, qty: 0, revenue: 0 };
            acc.addons.set(addonKey, existing);
          }
          existing.qty += addon.qty ?? 0;
          existing.revenue += addon.revenue ?? 0;
        }
      }
    }

    const products: ProductStatOutput[] = Object.values(productMap)
      .map((p) => ({
        title: p.title,
        qty: p.qty,
        revenue: p.revenue,
        discount: p.discount,
        net: Math.round((p.revenue - p.discount) * 100) / 100,
        addons: [...p.addons.values()].map((a) => ({ title: a.title, qty: a.qty, revenue: a.revenue })),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProduct = products.length ? [...products].sort((a, b) => b.qty - a.qty)[0] : null;
    const avgTicket = completedOrders > 0 ? Math.round((totalSales / completedOrders) * 100) / 100 : 0;
    const totalDiscounts = Math.round(products.reduce((s, p) => s + p.discount, 0) * 100) / 100;

    return {
      ordersCount,
      completedOrders,
      totalSales,
      totalCash,
      totalTransfer,
      avgTicket,
      totalDiscounts,
      products,
      topProduct,
    };
  },
};
