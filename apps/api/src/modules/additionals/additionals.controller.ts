import { AdditionalsService } from './additionals.service';
import { makeCrudController } from '../../utils/makeController';

export const AdditionalsController = makeCrudController({
  service: AdditionalsService,
  entity: 'Adicional',
});
