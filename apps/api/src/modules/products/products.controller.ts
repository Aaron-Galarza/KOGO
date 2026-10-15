import { ProductsService } from './products.service';
import { makeCrudController } from '../../utils/makeController';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';

export const ProductsController = {
  ...makeCrudController({
    service: ProductsService,
    entity: 'Producto',
    getAllArgs: [true],
    withGetById: true,
  }),

  getDetailed: asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const product = await ProductsService.viewDetailedById(id);
    if (!product) {
      return sendError(res, 'Producto no encontrado', 404);
    }
    sendSuccess(res, product, 200);
  }),
};
