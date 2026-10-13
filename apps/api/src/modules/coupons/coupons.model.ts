import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountPercent: number;
  active: boolean;
  validDays: string[];
  validPaymentMethods: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'El código del cupón es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountPercent: {
      type: Number,
      required: [true, 'El porcentaje es obligatorio'],
      min: [1, 'El porcentaje debe ser mayor a 0'],
      max: [100, 'El porcentaje no puede superar 100'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    validDays: {
      type: [String],
      default: [],
    },
    validPaymentMethods: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const CouponModel = mongoose.model<ICoupon>('Coupon', CouponSchema);
