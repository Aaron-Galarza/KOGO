import { ProductsService } from './products.service';
import { makeCrudController } from '../../utils/makeController';

export const ProductsController = makeCrudController({
  service: ProductsService,
  entity: 'Producto',
  getAllArgs: [true],
  withGetById: true,
});
