import mongoose, { Schema, Document } from 'mongoose';
import { PRODUCT_TYPES, ProductType } from '../../constants';

export interface IProductGroupAssociation {
  _id?: mongoose.Types.ObjectId;
  grupo: mongoose.Types.ObjectId;
  orden: number;
  obligatorio?: boolean | null;
  minimo?: number | null;
  maximo?: number | null;
  ingredientes?: mongoose.Types.ObjectId[];
}

export interface IProduct extends Document {
  title: string;
  description?: string;
  price: number;
  image?: string;
  category: mongoose.Types.ObjectId;
  active: boolean;
  controlStock: boolean;
  stock: number;
  tipoProducto: ProductType;
  order: number;
  gruposOpciones: IProductGroupAssociation[];
  createdAt: Date;
  updatedAt: Date;
}

export const ProductGroupAssociationSchema = new Schema<IProductGroupAssociation>(
  {
    grupo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GrupoOpciones',
      required: [true, 'El grupo de opciones referenciado es obligatorio'],
    },
    orden: {
      type: Number,
      default: 0,
    },
    obligatorio: {
      type: Boolean,
      default: null,
    },
    minimo: {
      type: Number,
      default: null,
    },
    maximo: {
      type: Number,
      default: null,
    },
    ingredientes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Opcion' }],
      default: [],
    },
  },
  { _id: true }
);

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
    tipoProducto: {
      type: String,
      enum: PRODUCT_TYPES,
      default: 'simple',
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    gruposOpciones: {
      type: [ProductGroupAssociationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<IProduct>('Producto', productSchema);
