import { BannerModel, IBanner } from './banners.model';
import { makeCrud } from '../../utils/crudFactory';

export const BannersService = {
  ...makeCrud(BannerModel),

  getPublic: async (): Promise<IBanner[]> => {
    return await BannerModel.find({ active: true })
      .sort({ order: 1 })
      .lean();
  },
};
