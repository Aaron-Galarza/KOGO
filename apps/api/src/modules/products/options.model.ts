import mongoose, { Schema } from 'mongoose';
import { OPTION_GROUP_TYPES, OptionGroupType } from '../../constants';

export interface IProductOption {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  active: boolean;
  default: boolean;
  allowQuantity: boolean;
  maxQuantity: number;
  order: number;
}

export interface IProductOptionGroup {
  _id?: mongoose.Types.ObjectId;
  name: string;
  type: OptionGroupType;
  required: boolean;
  min: number;
  max: number;
  options: IProductOption[];
  order: number;
}

export const ProductOptionSchema = new Schema<IProductOption>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la opción es obligatorio'],
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'El precio de la opción no puede ser negativo'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    default: {
      type: Boolean,
      default: false,
    },
    allowQuantity: {
      type: Boolean,
      default: false,
    },
    maxQuantity: {
      type: Number,
      default: 1,
      min: [1, 'La cantidad máxima debe ser al menos 1'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

export const ProductOptionGroupSchema = new Schema<IProductOptionGroup>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del grupo de opciones es obligatorio'],
      trim: true,
    },
    type: {
      type: String,
      enum: OPTION_GROUP_TYPES,
      default: 'single',
    },
    required: {
      type: Boolean,
      default: false,
    },
    min: {
      type: Number,
      default: 0,
      min: [0, 'El mínimo no puede ser negativo'],
    },
    max: {
      type: Number,
      default: 1,
      min: [1, 'El máximo debe ser al menos 1'],
    },
    options: {
      type: [ProductOptionSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);
