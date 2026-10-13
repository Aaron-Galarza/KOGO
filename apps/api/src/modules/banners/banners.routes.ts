import { makeCrudRoutes } from '../../utils/makeRoutes';
import { BannersController } from './banners.controller';
import { BannerCreateSchema, BannerUpdateSchema } from './banners.schema';

export default makeCrudRoutes({
  controller: BannersController,
  createSchema: BannerCreateSchema,
  updateSchema: BannerUpdateSchema,
});
