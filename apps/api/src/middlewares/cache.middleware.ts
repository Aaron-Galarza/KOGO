import { Request, Response, NextFunction } from 'express';

export const cachePublic = (maxAgeSeconds = 300) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`);
    next();
  };
};
