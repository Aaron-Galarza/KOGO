import { ProductModel, IProduct } from './products.model';
import { CategoriaModel } from '../categories/categories.model';
import { makeCrud } from '../../utils/crudFactory';

export const ProductsService = {
  ...makeCrud(ProductModel),

  viewPublic: async (): Promise<IProduct[]> => {
    const products = await ProductModel.aggregate([
      { $match: { active: true } },
      {
        $lookup: {
          from: CategoriaModel.collection.name,
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $match: { 'category.active': true } },
      { $unwind: '$category' },
      { $sort: { 'category.order': 1, order: 1 } },
      {
        $addFields: {
          category: { _id: '$category._id', name: '$category.name', order: '$category.order' },
        },
      },
    ]);
    return products as IProduct[];
  },

  viewAll: async (includeInactive = false): Promise<IProduct[]> => {
    const filter = includeInactive ? {} : { active: true };
    return await ProductModel.find(filter)
      .populate('category', 'name order')
      .sort({ 'category.order': 1, order: 1 });
  },

  viewById: async (id: string): Promise<IProduct | null> => {
    return await ProductModel.findById(id).populate('category');
  },

  modify: async (id: string, updateData: Partial<IProduct>): Promise<IProduct | null> => {
    return await ProductModel.findByIdAndUpdate(id, updateData, { new: true }).populate('category');
  },
};
