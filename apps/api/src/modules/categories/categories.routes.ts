import { makeCrudRoutes } from '../../utils/makeRoutes';
import { CategoriesController } from './categories.controller';
import { CategoriaCreateSchema, CategoriaUpdateSchema } from './categories.schema';

export default makeCrudRoutes({
  controller: CategoriesController,
  createSchema: CategoriaCreateSchema,
  updateSchema: CategoriaUpdateSchema,
});
