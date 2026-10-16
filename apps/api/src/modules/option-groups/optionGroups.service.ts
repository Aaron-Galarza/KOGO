import { GrupoOpcionesModel } from './optionGroups.model';
import { makeCrud } from '../../utils/crudFactory';

const POPULATE = {
  path: 'ingredientes.ingrediente',
  select: 'nombre descripcion precio activo disponible orden',
};

export const OptionGroupsService = {
  ...makeCrud(GrupoOpcionesModel, 'activo'),

  viewPublic: async () => {
    return await GrupoOpcionesModel.find({ activo: true })
      .sort({ createdAt: 1 })
      .populate(POPULATE)
      .lean();
  },

  viewAll: async () => {
    return await GrupoOpcionesModel.find()
      .sort({ createdAt: 1 })
      .populate(POPULATE)
      .lean();
  },

  viewById: async (id: string) => {
    return await GrupoOpcionesModel.findById(id).populate(POPULATE);
  },
};
