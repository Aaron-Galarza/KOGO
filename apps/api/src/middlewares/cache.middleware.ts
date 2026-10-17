import { Request, Response, NextFunction } from 'express';

export const cachePublic = (maxAgeSeconds = 300) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds}`);
    next();
  };
};

/**
 * Datos operativos (horarios/turnos, estado de la tienda, cierre de emergencia,
 * precios de envío). Un cambio hecho en el admin tiene que verse al instante en
 * la web y en el POS: si se cachea, el negocio queda mostrando datos viejos
 * durante minutos y eso confunde. Son lecturas chicas, así que no cachear no
 * agrega carga real (Render no tiene CDN delante).
 */
export const noStore = (_req: Request, res: Response, next: NextFunction) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};
