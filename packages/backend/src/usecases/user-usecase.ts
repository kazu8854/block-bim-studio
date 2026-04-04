import type { User } from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class UserUsecase {
  constructor(private readonly db: DbPort) {}

  async getUser(id: string): Promise<User | null> {
    return this.db.getUser(id);
  }
}
