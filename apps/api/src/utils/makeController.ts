import { Request, Response } from 'express';
import { asyncHandler } from './asyncHandler';
import { sendSuccess, sendError } from './response';

interface MakeCrudControllerOptions {
  service: Record<string, any>;
  entity: string;
  publicMethod?: string;
  getAllArgs?: any[];
  withGetById?: boolean;
  withPublicList?: boolean;
  withValidate?: boolean;
  deleteHandlesErrors?: boolean;
}

const genderSuffix = (entity: string): string => {
  return entity.trim().toLowerCase().endsWith('a') ? 'a' : 'o';
};

export const makeCrudController = (options: MakeCrudControllerOptions) => {
  const {
    service,
    entity,
    publicMethod = 'viewPublic',
    getAllArgs = [],
    withGetById = false,
    withPublicList = true,
    withValidate = false,
    deleteHandlesErrors = false,
  } = options;

  const suffix = genderSuffix(entity);
  const notFoundMsg = `${entity} no encontrad${suffix}`;
  const createdMsg = `${entity} cread${suffix} exitosamente`;
  const updatedMsg = `${entity} actualizad${suffix}`;
  const deletedMsg = `${entity} eliminad${suffix}`;

  const controller: Record<string, any> = {};

  if (withPublicList) {
    controller.getPublic = asyncHandler(async (req: Request, res: Response) => {
      const items = await service[publicMethod]();
      sendSuccess(res, items, 200);
    });
  }

  controller.getAll = asyncHandler(async (req: Request, res: Response) => {
    const items = await service.viewAll(...getAllArgs);
    sendSuccess(res, items, 200);
  });

  if (withGetById) {
    controller.getById = asyncHandler(async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const item = await service.viewById(id);
      if (!item) {
        return sendError(res, notFoundMsg, 404);
      }
      sendSuccess(res, item, 200);
    });
  }

  controller.create = asyncHandler(async (req: Request, res: Response) => {
    const item = await service.create(req.body);
    sendSuccess(res, item, 201, createdMsg);
  });

  controller.update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const item = await service.modify(id, req.body);
    if (!item) {
      return sendError(res, notFoundMsg, 404);
    }
    sendSuccess(res, item, 200, updatedMsg);
  });

  controller.toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const item = await service.toggleActive(id);
    if (!item) {
      return sendError(res, notFoundMsg, 404);
    }
    sendSuccess(res, item, 200);
  });

  controller.delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (deleteHandlesErrors) {
      try {
        const deleted = await service.deleteById(id);
        if (!deleted) {
          return sendError(res, notFoundMsg, 404);
        }
        return sendSuccess(res, { id }, 200, deletedMsg);
      } catch (error: any) {
        return sendError(res, error.message, 400);
      }
    }

    const deleted = await service.deleteById(id);
    if (!deleted) {
      return sendError(res, notFoundMsg, 404);
    }
    sendSuccess(res, { id }, 200, deletedMsg);
  });

  if (withValidate) {
    controller.validate = asyncHandler(async (req: Request, res: Response) => {
      const { code, paymentMethod } = req.body;
      if (!code) {
        return sendError(res, 'El código del cupón es requerido', 400);
      }

      try {
        const coupon = await service.validateCoupon(code, paymentMethod);
        sendSuccess(res, coupon, 200);
      } catch (error: any) {
        sendError(res, error.message, 400);
      }
    });
  }

  return controller;
};
