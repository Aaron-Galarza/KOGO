import mongoose, { Schema, Document } from 'mongoose';

export interface IProductAddonStat {
  title: string;
  qty: number;
  revenue: number;
}

export interface IProductDailyStat {
  title: string;
  qty: number;
  revenue: number;
  discount: number;
  addons: Map<string, IProductAddonStat>;
}

export interface IOrderDailyStats extends Document {
  date: string; // "YYYY-MM-DD"
  ordersCount: number;
  completedOrders: number;
  totalSales: number;
  totalCash: number;
  totalTransfer: number;
  products: Map<string, IProductDailyStat>;
}

const ProductAddonStatSchema = new Schema<IProductAddonStat>(
  {
    title: { type: String, required: true },
    qty: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductDailyStatSchema = new Schema<IProductDailyStat>(
  {
    title: { type: String, required: true },
    qty: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    addons: {
      type: Map,
      of: ProductAddonStatSchema,
      default: {},
    },
  },
  { _id: false }
);

const orderDailyStatsSchema = new Schema<IOrderDailyStats>(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ordersCount: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },
    totalTransfer: { type: Number, default: 0 },
    products: {
      type: Map,
      of: ProductDailyStatSchema,
      default: {},
    },
  },
  { timestamps: true }
);

export const OrderDailyStats = mongoose.model<IOrderDailyStats>(
  'OrderDailyStats',
  orderDailyStatsSchema
);
