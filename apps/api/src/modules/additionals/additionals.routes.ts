import { makeCrudRoutes } from '../../utils/makeRoutes';
import { AdditionalsController } from './additionals.controller';
import { AdicionalCreateSchema, AdicionalUpdateSchema } from './additionals.schema';

export default makeCrudRoutes({
  controller: AdditionalsController,
  createSchema: AdicionalCreateSchema,
  updateSchema: AdicionalUpdateSchema,
});
