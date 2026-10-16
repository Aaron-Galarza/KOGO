import mongoose, { Schema, Document } from 'mongoose';

export interface IOpcion extends Document {
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  disponible: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

const OpcionSchema = new Schema<IOpcion>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del ingrediente es obligatorio'],
      trim: true,
      index: true,
    },
    descripcion: {
      type: String,
    },
    precio: {
      type: Number,
      default: 0,
      min: [0, 'El precio no puede ser negativo'],
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

export const OpcionModel = mongoose.model<IOpcion>('Opcion', OpcionSchema);
