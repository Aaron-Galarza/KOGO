import mongoose, { Schema, Document } from 'mongoose';
import {
  PAYMENT_STATUSES,
  PAYMENT_PROVIDERS,
  PaymentStatus,
  PaymentProvider,
} from '../../constants';

// ============================================================
// Colección de pagos online (Mercado Pago Checkout Pro).
//
// SEGURIDAD: esta colección guarda SOLO lo necesario para conciliar
// el pedido con el proveedor. NUNCA se persisten:
//   - access tokens ni webhook secrets
//   - datos de tarjeta (número, CVV, vencimiento)
//   - datos personales del pagador más allá de la referencia del pedido
// Si en el futuro hace falta más información, revisar antes de agregarla.
// ============================================================

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  provider: PaymentProvider;
  mpOrderId?: string | null;
  externalReference: string;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusDetail?: string | null;
  checkoutUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: PAYMENT_PROVIDERS,
      required: true,
    },
    // Identificador del recurso creado en la Orders API (NO es un preference id).
    mpOrderId: {
      type: String,
      default: null,
    },
    externalReference: {
      type: String,
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'ARS',
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    statusDetail: {
      type: String,
      default: null,
    },
    checkoutUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Un recurso de Mercado Pago no puede asociarse a dos pagos locales.
paymentSchema.index({ mpOrderId: 1 }, { unique: true, sparse: true });

export const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);
