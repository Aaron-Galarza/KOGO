import mongoose, { Model } from 'mongoose';

export const makeCrud = <T extends { active?: boolean }>(model: Model<T>) => {
  return {
    viewAll: async (): Promise<T[]> => {
      return await model.find().lean();
    },

    viewActive: async (): Promise<T[]> => {
      return await model.find({ active: true }).lean();
    },

    viewById: async (id: string): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await model.findById(id);
    },

    create: async (data: Partial<T>): Promise<T> => {
      const doc = new model(data);
      return await doc.save();
    },

    modify: async (id: string, data: Partial<T>): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      return await model.findByIdAndUpdate(id, data, { new: true });
    },

    toggleActive: async (id: string): Promise<T | null> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await model.findById(id);
      if (!doc) return null;
      doc.active = !doc.active;
      return await doc.save();
    },

    deleteById: async (id: string): Promise<boolean> => {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const result = await model.findByIdAndDelete(id);
      return !!result;
    },
  };
};
