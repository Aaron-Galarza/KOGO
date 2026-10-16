import { Request, Response } from 'express';
import { GeocodingService } from './geocoding.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class GeocodingController {
  /** GET /api/geocoding/search?q=...  (público, con rate limit y tope mensual) */
  static search = asyncHandler(async (req: Request, res: Response) => {
    const query = String(req.query.q ?? '');
    const { results, cached } = await GeocodingService.search(query);

    // El navegador puede cachear búsquedas repetidas (no vuelve a pegarle al server).
    res.set('Cache-Control', cached ? 'public, max-age=86400' : 'public, max-age=3600');
    sendSuccess(res, { results, cached }, 200);
  });

  /** GET /api/geocoding/usage (admin): monitoreo del consumo mensual. */
  static usage = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, GeocodingService.getUsage(), 200);
  });
}
