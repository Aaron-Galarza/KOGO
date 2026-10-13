import { makeCrudRoutes } from '../../utils/makeRoutes';
import { CouponsController } from './coupons.controller';
import { CouponCreateSchema, CouponUpdateSchema } from './coupons.schema';

export default makeCrudRoutes({
  controller: CouponsController,
  createSchema: CouponCreateSchema,
  updateSchema: CouponUpdateSchema,
  listPath: '/admin',
  withPublicList: false,
  publicExtras: (router) => {
    router.post('/validate', CouponsController.validate);
  },
});
