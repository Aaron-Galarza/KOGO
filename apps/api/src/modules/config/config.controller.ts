import { Request, Response } from 'express';
import { ConfigService } from './config.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class ConfigController {
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigService.getStatus();
    sendSuccess(res, config, 200);
  });

  static updateSchedule = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigService.updateSchedule(req.body.dailySchedule);
    sendSuccess(res, config, 200, 'Horarios actualizados');
  });

  static toggleEmergency = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigService.toggleEmergencyClosed();
    sendSuccess(res, config, 200);
  });

  static updateEmergencyMessage = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigService.updateEmergencyMessage(req.body.message);
    sendSuccess(res, config, 200, 'Mensaje actualizado');
  });

  static updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const config = await ConfigService.updateBanner(req.body.banner);
    sendSuccess(res, config, 200, 'Banner actualizado');
  });
}
