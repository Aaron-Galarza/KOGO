import { Router } from 'express';
import { UsersController } from './users.controller';
import { validateRequest } from '../../middlewares/validate.middleware';
import { authLimiter } from '../../middlewares/rateLimit.middleware';
import { UserLoginSchema } from './users.schema';

const router = Router();

router.post('/login', authLimiter, validateRequest(UserLoginSchema), UsersController.login);

export default router;
