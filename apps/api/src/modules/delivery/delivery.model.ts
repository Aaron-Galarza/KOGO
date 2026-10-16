import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKmRange {
  /** Identificador estable para poder borrar un rango puntual desde el admin. */
  id: string;
  maxKm: number;
  price: number;
}

export interface IDeliveryConfig extends Document {
  kmRanges: IKmRange[];
  /** Radio máximo de reparto: más lejos que esto no se cobra automático. */
  maxDeliveryKm: number;
  extraRain: number;
  isRaining: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeliveryConfigModel extends Model<IDeliveryConfig> {
  getOrCreateConfig(): Promise<IDeliveryConfig>;
}

// Valores iniciales de la tabla de envío.
//
// IMPORTANTE: son los precios que se cobran en el checkout. Revisalos en
// Admin > Configuración antes de operar en producción.
export const DEFAULT_KM_RANGES: Omit<IKmRange, 'id'>[] = [
  { maxKm: 3, price: 1500 },
  { maxKm: 6, price: 2500 },
  { maxKm: 10, price: 4000 },
];

const kmRangeSchema = new Schema<IKmRange>(
  {
    id: { type: String, required: true },
    maxKm: { type: Number, required: true, min: 0.1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const deliveryConfigSchema = new Schema<IDeliveryConfig>(
  {
    kmRanges: { type: [kmRangeSchema], default: [] },
    maxDeliveryKm: { type: Number, default: 12, min: 0.5 },
    extraRain: { type: Number, default: 0, min: 0 },
    isRaining: { type: Boolean, default: false },
  },
  { timestamps: true }
);

deliveryConfigSchema.statics.getOrCreateConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      kmRanges: DEFAULT_KM_RANGES.map((r) => ({
        id: new mongoose.Types.ObjectId().toString(),
        ...r,
      })),
      maxDeliveryKm: 12,
      extraRain: 0,
      isRaining: false,
    });
  }
  return config;
};

export const DeliveryConfigModel = mongoose.model<IDeliveryConfig, IDeliveryConfigModel>(
  'DeliveryConfig',
  deliveryConfigSchema
);
