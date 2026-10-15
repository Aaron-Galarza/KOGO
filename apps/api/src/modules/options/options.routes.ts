import { makeCrudRoutes } from '../../utils/makeRoutes';
import { OptionsController } from './options.controller';
import { OptionCreateSchema, OptionUpdateSchema } from './options.schema';

export default makeCrudRoutes({
  controller: OptionsController,
  createSchema: OptionCreateSchema,
  updateSchema: OptionUpdateSchema,
  withGetById: true,
});
