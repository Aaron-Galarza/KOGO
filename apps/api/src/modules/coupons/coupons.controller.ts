import { CouponsService } from './coupons.service';
import { makeCrudController } from '../../utils/makeController';

export const CouponsController = makeCrudController({
  service: CouponsService,
  entity: 'Cupón',
  withPublicList: false,
  withValidate: true,
});
