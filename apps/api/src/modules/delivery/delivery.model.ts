import mongoose, { Schema, Document, Model } from 'mongoose';
import { STORE_LAT, STORE_LNG } from '../../constants';

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
  /** Punto de partida de los repartos: desde acá se miden los km. */
  originLat: number;
  originLng: number;
  /** Texto de la dirección elegida (solo para mostrar en el admin). */
  originLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeliveryConfigModel extends Model<IDeliveryConfig> {
  getOrCreateConfig(): Promise<IDeliveryConfig>;
}

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
    // La tabla arranca VACÍA a propósito: los precios los carga el negocio.
    // Con la tabla vacía no se inventa ningún precio (el checkout avisa que
    // el envío se coordina) y tampoco se escribe nada en los pedidos.
    kmRanges: { type: [kmRangeSchema], default: [] },
    maxDeliveryKm: { type: Number, default: 12, min: 0.5 },
    extraRain: { type: Number, default: 0, min: 0 },
    isRaining: { type: Boolean, default: false },
    // Punto de partida por defecto: la ubicación del local (se puede cambiar
    // en tiempo de ejecución desde Configuración > Envío a domicilio).
    originLat: { type: Number, default: STORE_LAT, min: -90, max: 90 },
    originLng: { type: Number, default: STORE_LNG, min: -180, max: 180 },
    originLabel: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { timestamps: true }
);

deliveryConfigSchema.statics.getOrCreateConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      kmRanges: [],
      maxDeliveryKm: 12,
      extraRain: 0,
      isRaining: false,
      originLat: STORE_LAT,
      originLng: STORE_LNG,
    });
  }
  return config;
};

export const DeliveryConfigModel = mongoose.model<IDeliveryConfig, IDeliveryConfigModel>(
  'DeliveryConfig',
  deliveryConfigSchema
);
