import { AdicionalModel } from './additionals.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(AdicionalModel);

export const AdditionalsService = {
  ...crud,

  viewPublic: crud.viewActive,
};
