import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description?: string;
  price: number;
  image?: string;
  category: mongoose.Types.ObjectId;
  active: boolean;
  controlStock: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    description: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La categoría es obligatoria'],
      index: true,
    },
    image: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    controlStock: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<IProduct>('Producto', productSchema);
