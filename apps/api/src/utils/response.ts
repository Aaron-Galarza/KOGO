import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode = 200, message?: string) => {
  const response: any = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode = 400, details?: any) => {
  const response: any = { success: false, error };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
};
