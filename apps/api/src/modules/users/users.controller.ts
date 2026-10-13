import { Request, Response } from 'express';
import { UserService } from './users.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class UsersController {
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await UserService.login(email, password);
    sendSuccess(res, result);
  });
}
