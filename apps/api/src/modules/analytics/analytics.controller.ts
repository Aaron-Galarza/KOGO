import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { GetStatsQuerySchema } from './analytics.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';

export class AnalyticsController {
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const parsed = GetStatsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return sendError(res, firstError?.message || 'Parámetros inválidos', 400);
    }

    const stats = await AnalyticsService.getStats(parsed.data);
    sendSuccess(res, stats, 200);
  });
}
