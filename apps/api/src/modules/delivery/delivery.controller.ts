import { Request, Response } from 'express';
import { DeliveryService } from './delivery.service';
import { DistanceService } from './distance.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';

export class DeliveryController {
  /** POST /api/delivery/calculate — vista previa del costo de envío (público). */
  static calculate = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng } = req.body;
    const quote = await DeliveryService.calculate(lat, lng);
    // El precio se recalcula siempre; acá solo se informa el resultado actual.
    res.set('Cache-Control', 'no-store');
    sendSuccess(res, quote, 200);
  });

  /** GET /api/delivery/config/public — datos mínimos para el checkout. */
  static publicConfig = asyncHandler(async (_req: Request, res: Response) => {
    const config = await DeliveryService.publicConfig();
    sendSuccess(res, config, 200);
  });

  /** GET /api/delivery/config — configuración completa (admin). */
  static getConfig = asyncHandler(async (_req: Request, res: Response) => {
    const config = await DeliveryService.publicConfig();
    sendSuccess(res, config, 200);
  });

  /** PUT /api/delivery/config — edición (admin). */
  static updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = await DeliveryService.updateConfig(req.body);
    sendSuccess(res, await DeliveryService.publicConfig(), 200, 'Configuración de envío actualizada');
  });

  /** PATCH /api/delivery/config/rain — lluvia y recargo (admin). */
  static updateRain = asyncHandler(async (req: Request, res: Response) => {
    await DeliveryService.setRain(req.body);
    sendSuccess(res, await DeliveryService.publicConfig(), 200, 'Recargo por lluvia actualizado');
  });

  /** POST /api/delivery/config/ranges — agregar rango (admin). */
  static addRange = asyncHandler(async (req: Request, res: Response) => {
    await DeliveryService.addRange(req.body);
    sendSuccess(res, await DeliveryService.publicConfig(), 201, 'Rango agregado');
  });

  /** DELETE /api/delivery/config/ranges/:id — borrar rango (admin). */
  static deleteRange = asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? '');
    if (!id) return sendError(res, 'Falta el id del rango', 400);
    await DeliveryService.deleteRange(id);
    sendSuccess(res, await DeliveryService.publicConfig(), 200, 'Rango eliminado');
  });

  /** GET /api/delivery/usage — consumo de Google (admin). */
  static usage = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, { routes: DistanceService.getUsage() }, 200);
  });
}
