import { makeCrudRoutes } from '../../utils/makeRoutes';
import { ProductsController } from './products.controller';
import { ProductCreateSchema, ProductUpdateSchema } from './products.schema';

export default makeCrudRoutes({
  controller: ProductsController,
  createSchema: ProductCreateSchema,
  updateSchema: ProductUpdateSchema,
  withGetById: true,
  publicExtras: (router) => {
    router.get('/:id', ProductsController.getDetailed);
  },
});
