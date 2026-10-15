import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoria extends Document {
  name: string;
  description?: string;
  order: number;
  active: boolean;
  icon?: string;
  parent?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CategoriaSchema = new Schema<ICategoria>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    icon: {
      type: String,
      default: '',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const CategoriaModel = mongoose.model<ICategoria>('Categoria', CategoriaSchema);
