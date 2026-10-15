import { OpcionModel } from './options.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(OpcionModel, 'activo');

export const OptionsService = {
  ...crud,

  viewPublic: async () => {
    return await OpcionModel.find({ activo: true })
      .sort({ orden: 1, nombre: 1 })
      .lean();
  },
};
