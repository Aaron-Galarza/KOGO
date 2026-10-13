import { CategoriesService } from './categories.service';
import { makeCrudController } from '../../utils/makeController';

export const CategoriesController = makeCrudController({
  service: CategoriesService,
  entity: 'Categoría',
  deleteHandlesErrors: true,
});
