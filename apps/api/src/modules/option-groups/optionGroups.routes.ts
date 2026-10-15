import { makeCrudRoutes } from '../../utils/makeRoutes';
import { OptionGroupsController } from './optionGroups.controller';
import { OptionGroupCreateSchema, OptionGroupUpdateSchema } from './optionGroups.schema';

export default makeCrudRoutes({
  controller: OptionGroupsController,
  createSchema: OptionGroupCreateSchema,
  updateSchema: OptionGroupUpdateSchema,
  withGetById: true,
});
