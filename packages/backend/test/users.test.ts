import { describe, expect, it } from 'vitest';
import { UserDetailResponseSchema } from '@block-bim-studio/shared';
import { createTestApp } from './helpers.js';

describe('Users API contract', () => {
  it('GET existing demo user includes stub meta', async () => {
    const app = createTestApp();
    const res = await app.request(
      '/api/users/00000000-0000-4000-8000-000000000001',
    );
    expect(res.status).toBe(200);
    UserDetailResponseSchema.parse(await res.json());
  });
});
