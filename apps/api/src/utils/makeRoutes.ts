import { Router } from 'express';
import { protect, isAdmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { cachePublic } from '../middlewares/cache.middleware';

interface MakeCrudRoutesOptions {
  controller: Record<string, any>;
  createSchema?: any;
  updateSchema?: any;
  listPath?: string;
  withGetById?: boolean;
  withPublicList?: boolean;
  publicExtras?: (router: Router) => void;
}

export const makeCrudRoutes = (options: MakeCrudRoutesOptions) => {
  const {
    controller,
    createSchema,
    updateSchema,
    listPath = '/admin/all',
    withGetById = false,
    withPublicList = true,
    publicExtras,
  } = options;

  const router = Router();

  if (withPublicList) {
    router.get('/', cachePublic(), controller.getPublic);
  }

  router.get(listPath, protect, isAdmin, controller.getAll);

  if (withGetById) {
    router.get('/admin/:id', protect, isAdmin, controller.getById);
  }

  if (createSchema) {
    router.post('/admin', protect, isAdmin, validateRequest(createSchema), controller.create);
  }

  if (updateSchema) {
    router.put('/admin/:id', protect, isAdmin, validateRequest(updateSchema), controller.update);
  }

  router.patch('/admin/:id/toggle', protect, isAdmin, controller.toggleActive);
  router.delete('/admin/:id', protect, isAdmin, controller.delete);

  if (publicExtras) {
    publicExtras(router);
  }

  return router;
};
