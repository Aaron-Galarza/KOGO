import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      const firstError = error.issues?.[0] ?? error.errors?.[0];
      const message = firstError?.message || 'Validación fallida';
      const path = firstError?.path?.[0] ? ` (${firstError.path[0]})` : '';

      res.status(400).json({
        success: false,
        error: `${message}${path}`,
      });
    }
  };
}
