import { CategoriaModel, ICategoria } from './categories.model';
import { makeCrud } from '../../utils/crudFactory';
import { ProductModel } from '../products/products.model';
import { AppError } from '../../utils/appError';

export const CategoriesService = {
  ...makeCrud(CategoriaModel),

  viewPublic: async (): Promise<ICategoria[]> => {
    return await CategoriaModel.find({ active: true })
      .sort({ order: 1 })
      .lean();
  },

  deleteById: async (id: string): Promise<boolean> => {
    const count = await ProductModel.countDocuments({ category: id, active: true });
    if (count > 0) {
      throw new AppError('No puedes eliminar una categoría con productos activos', 400);
    }
    const result = await CategoriaModel.findByIdAndDelete(id);
    return !!result;
  },
};
