import mongoose, { Schema, Document } from 'mongoose';

export interface IAdicional extends Document {
  title: string;
  price: number;
  categories?: mongoose.Types.ObjectId[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdicionalSchema = new Schema<IAdicional>(
  {
    title: {
      type: String,
      required: [true, 'El nombre del adicional es obligatorio'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    categories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Categoria',
        },
      ],
      default: [],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const AdicionalModel = mongoose.model<IAdicional>('Adicional', AdicionalSchema);
