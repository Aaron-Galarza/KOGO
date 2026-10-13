import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  let message = isOperational ? err.message : 'Error interno del servidor';
  let details: any = null;

  // Los errores internos se loguean completos pero nunca se exponen al cliente
  if (!isOperational) {
    console.error(`[ERROR INTERNO] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.error(`[ERROR] ${statusCode}: ${message}`);
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const mongoErr = err as any;
    if (mongoErr.code === 11000) {
      const field = Object.keys(mongoErr.keyPattern)[0];
      message = `El campo '${field}' ya existe`;
      details = { field, code: 'DUPLICATE_KEY' };
    } else if (mongoErr.code === 121) {
      message = 'El documento no cumple con el esquema validado';
      details = { code: 'DOCUMENT_VALIDATION_FAILED' };
    }
  }

  const response: any = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
