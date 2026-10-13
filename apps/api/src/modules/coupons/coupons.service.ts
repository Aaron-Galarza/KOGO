import { CouponModel, ICoupon } from './coupons.model';
import { makeCrud } from '../../utils/crudFactory';
import { AppError } from '../../utils/appError';
import { WEEK_DAYS } from '../../constants';
import { toArgentina } from '../../utils/argentinaTime';

export const CouponsService = {
  ...makeCrud(CouponModel),

  viewAll: async (): Promise<ICoupon[]> => {
    return await CouponModel.find().sort({ createdAt: -1 });
  },

  validateCoupon: async (code: string, paymentMethod?: string): Promise<ICoupon> => {
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      active: true,
    }).lean();

    if (!coupon) {
      throw new AppError('Cupón no válido', 400);
    }

    if (coupon.validDays && coupon.validDays.length > 0) {
      const today = WEEK_DAYS[toArgentina(new Date()).getUTCDay()];
      if (!coupon.validDays.includes(today)) {
        throw new AppError('Este cupón no es válido hoy', 400);
      }
    }

    if (coupon.validPaymentMethods && coupon.validPaymentMethods.length > 0) {
      if (!coupon.validPaymentMethods.includes(paymentMethod || '')) {
        throw new AppError(`Este cupón no aplica con ${paymentMethod || 'este método de pago'}`, 400);
      }
    }

    return coupon;
  },
};
