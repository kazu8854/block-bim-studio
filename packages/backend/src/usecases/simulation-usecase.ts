import type { Block } from '@block-bim-studio/shared';
import {
  calculateCostLevel0,
  calculateQuantityLevel0,
  detectClashesLevel0,
} from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class SimulationUsecase {
  constructor(private readonly db: DbPort) {}

  private async loadBlocks(projectId: string): Promise<Block[] | null> {
    const p = await this.db.getProject(projectId);
    return p ? p.blocks : null;
  }

  async quantity(projectId: string) {
    const blocks = await this.loadBlocks(projectId);
    if (!blocks) return null;
    return calculateQuantityLevel0(blocks);
  }

  async cost(projectId: string) {
    const blocks = await this.loadBlocks(projectId);
    if (!blocks) return null;
    return calculateCostLevel0(blocks);
  }

  async clash(projectId: string) {
    const blocks = await this.loadBlocks(projectId);
    if (!blocks) return null;
    return detectClashesLevel0(blocks);
  }

  quantityFromBlocks(blocks: Block[]) {
    return calculateQuantityLevel0(blocks);
  }

  costFromBlocks(blocks: Block[]) {
    return calculateCostLevel0(blocks);
  }

  clashFromBlocks(blocks: Block[]) {
    return detectClashesLevel0(blocks);
  }
}
