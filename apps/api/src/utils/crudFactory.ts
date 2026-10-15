import mongoose, { Model } from 'mongoose';

// Factory CRUD genérico. Por defecto usa el campo `active` como bandera de
// visibilidad (convención de todo el proyecto). Se puede pasar otro nombre
// de campo (ej: 'activo') para los modelos que usan otra nomenclatura.
export const makeCrud = <T>(model: Model<T>, activeField = 'active') => {
  return {
    viewAll: async (): Promise<T[]> => {
      return await model.find().lean();
    },

    viewActive: async (): Promise<T[]> => {
      return await model.find({ [activeField]: true } as any).lean();
    },

    viewById: async (id: string): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await model.findById(id);
    },

    create: async (data: Partial<T>): Promise<T> => {
      const doc = new model(data);
      return (await doc.save()) as unknown as T;
    },

    modify: async (id: string, data: Partial<T>): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return (await model.findByIdAndUpdate(id, data, { new: true })) as unknown as T | null;
    },

    toggleActive: async (id: string): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc: any = await model.findById(id);
      if (!doc) return null;
      doc[activeField] = !doc[activeField];
      return (await doc.save()) as unknown as T;
    },

    deleteById: async (id: string): Promise<boolean> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const result = await model.findByIdAndDelete(id);
      return !!result;
    },
  };
};
