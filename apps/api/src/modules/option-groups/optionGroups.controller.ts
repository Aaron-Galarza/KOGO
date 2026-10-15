import { OptionGroupsService } from './optionGroups.service';
import { makeCrudController } from '../../utils/makeController';

export const OptionGroupsController = makeCrudController({
  service: OptionGroupsService,
  entity: 'Grupo de opciones',
  withGetById: true,
});
