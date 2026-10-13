import { BannersService } from './banners.service';
import { makeCrudController } from '../../utils/makeController';

export const BannersController = makeCrudController({
  service: BannersService,
  entity: 'Banner',
  publicMethod: 'getPublic',
});
