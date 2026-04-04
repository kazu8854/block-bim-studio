import { UserDetailResponseSchema } from '@block-bim-studio/shared';
import { Hono } from 'hono';
import type { UserUsecase } from '../usecases/user-usecase.js';
import { STUB_LEVEL_0 } from './stub.js';

export function createUsersApp(userUsecase: UserUsecase) {
  const app = new Hono();

  app.get('/:id', async (c) => {
    const user = await userUsecase.getUser(c.req.param('id'));
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    const body = UserDetailResponseSchema.parse({ ...user, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  return app;
}
