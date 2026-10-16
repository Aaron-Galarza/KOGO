import mongoose, { Schema, Document } from 'mongoose';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  DELIVERY_TYPES,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryType,
} from '../../constants';

export interface IOrderItemAddon {
  addonId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrderItemIngrediente {
  grupoId: string;
  grupoNombre: string;
  ingredienteId: string;
  ingredienteNombre: string;
  precio: number;
  cantidad: number;
}

export interface IOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  additionals: IOrderItemAddon[];
  ingredientes: IOrderItemIngrediente[];
  precioBaseUnidad: number;
  precioIngredientesUnidad: number;
  precioFinalUnidad: number;
  totalLinea: number;
}

export interface IOrderCoordinates {
  lat: number;
  lng: number;
}

export interface IOrder extends Document {
  customer: {
    name: string;
    phone: string;
  };
  items: IOrderItem[];
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  couponCode?: string | null;
  discountPercent: number;
  subtotal: number;
  deliveryCost?: number;
  total: number;
  status: OrderStatus;
  delivery?: {
    address?: string;
    coordinates?: IOrderCoordinates;
    /** Distancia real (o estimada) desde el local, en km. La calcula el backend. */
    distanceKm?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemAddonSchema = new Schema<IOrderItemAddon>({
  addonId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderItemIngredienteSchema = new Schema<IOrderItemIngrediente>({
  grupoId: { type: String, required: true },
  grupoNombre: { type: String, required: true },
  ingredienteId: { type: String, required: true },
  ingredienteNombre: { type: String, required: true },
  precio: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  additionals: { type: [OrderItemAddonSchema], default: [] },
  ingredientes: { type: [OrderItemIngredienteSchema], default: [] },
  precioBaseUnidad: { type: Number, default: 0, min: 0 },
  precioIngredientesUnidad: { type: Number, default: 0, min: 0 },
  precioFinalUnidad: { type: Number, default: 0, min: 0 },
  totalLinea: { type: Number, default: 0, min: 0 },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    customer: {
      name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        trim: true,
      },
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: any[]) => items.length > 0,
        message: 'La orden debe tener al menos un artículo',
      },
    },
    deliveryType: {
      type: String,
      enum: DELIVERY_TYPES,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'not_required',
      index: true,
    },
    couponCode: {
      type: String,
      trim: true,
      default: null,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    delivery: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      distanceKm: { type: Number },
    },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
