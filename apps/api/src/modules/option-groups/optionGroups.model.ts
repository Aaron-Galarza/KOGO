import mongoose, { Schema, Document } from 'mongoose';
import { OPTION_GROUP_TYPES, OptionGroupType } from '../../constants';

export interface IGroupOption {
  _id?: mongoose.Types.ObjectId;
  ingrediente: mongoose.Types.ObjectId;
  orden: number;
  activo: boolean;
  permiteCantidad: boolean;
  cantidadMaxima: number;
  precioEspecial?: number | null;
}

export interface IGrupoOpciones extends Document {
  nombre: string;
  descripcion?: string;
  tipo: OptionGroupType;
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  activo: boolean;
  ingredientes: IGroupOption[];
  createdAt: Date;
  updatedAt: Date;
}

export const GroupOptionSchema = new Schema<IGroupOption>(
  {
    ingrediente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opcion',
      required: [true, 'El ingrediente referenciado es obligatorio'],
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    permiteCantidad: {
      type: Boolean,
      default: false,
    },
    cantidadMaxima: {
      type: Number,
      default: 1,
      min: [1, 'La cantidad máxima debe ser al menos 1'],
    },
    precioEspecial: {
      type: Number,
      default: null,
      min: [0, 'El precio no puede ser negativo'],
    },
  },
  { _id: true }
);

const GrupoOpcionesSchema = new Schema<IGrupoOpciones>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del grupo de opciones es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
    },
    tipo: {
      type: String,
      enum: OPTION_GROUP_TYPES,
      default: 'unico',
    },
    obligatorio: {
      type: Boolean,
      default: false,
    },
    minimo: {
      type: Number,
      default: 0,
      min: [0, 'El mínimo no puede ser negativo'],
    },
    maximo: {
      type: Number,
      default: 1,
      min: [1, 'El máximo debe ser al menos 1'],
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    ingredientes: {
      type: [GroupOptionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const GrupoOpcionesModel = mongoose.model<IGrupoOpciones>(
  'GrupoOpciones',
  GrupoOpcionesSchema
);
