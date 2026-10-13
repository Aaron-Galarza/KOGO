import { ConfigModel, IConfig } from './config.model';

const SPANISH_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ConfigService = {
  getStatus: async (): Promise<IConfig> => {
    return await ConfigService.getOrCreateConfig();
  },

  // Misma lógica que StoreStatus.tsx en el frontend: combina el flag manual,
  // el cierre de emergencia y el horario del día actual.
  isOpenNow: (config: IConfig): boolean => {
    if (!config.isOpen || config.isEmergencyClosed) return false;

    // El server corre en UTC; el horario del local está en hora argentina (UTC-3).
    // Restamos 3hs para leer la hora local argentina y comparar contra el schedule.
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const today = SPANISH_DAYS[now.getUTCDay()];
    const todaySchedule = config.dailySchedule?.find((d) => d.day === today);

    if (!todaySchedule?.isStoreOpen) return false;

    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const [oh, om] = todaySchedule.openTime.split(':').map(Number);
    const [ch, cm] = todaySchedule.closeTime.split(':').map(Number);
    const openMin = oh * 60 + om;
    let closeMin = ch * 60 + cm;
    if (closeMin <= openMin) closeMin += 24 * 60;

    return currentMinutes >= openMin && currentMinutes <= closeMin;
  },

  getOrCreateConfig: async (): Promise<IConfig> => {
    return await ConfigModel.getOrCreateConfig();
  },

  updateSchedule: async (dailySchedule: any[]): Promise<IConfig | null> => {
    return await ConfigModel.findOneAndUpdate({}, { dailySchedule }, { new: true });
  },

  toggleEmergencyClosed: async (): Promise<IConfig | null> => {
    const config = await ConfigModel.findOne();
    if (!config) {
      const newConfig = await ConfigModel.create({ isEmergencyClosed: true });
      return newConfig;
    }
    config.isEmergencyClosed = !config.isEmergencyClosed;
    return await config.save();
  },

  updateEmergencyMessage: async (message: string): Promise<IConfig | null> => {
    return await ConfigModel.findOneAndUpdate({}, { emergencyMessage: message }, { new: true });
  },

  updateBanner: async (banner: string): Promise<IConfig | null> => {
    return await ConfigModel.findOneAndUpdate({}, { banner }, { new: true });
  },
};
