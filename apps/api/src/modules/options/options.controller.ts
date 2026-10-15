import { OptionsService } from './options.service';
import { makeCrudController } from '../../utils/makeController';

export const OptionsController = makeCrudController({
  service: OptionsService,
  entity: 'Opción',
  withGetById: true,
});
