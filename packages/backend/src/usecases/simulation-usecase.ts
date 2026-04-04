import type { Block } from '@block-bim-studio/shared';
import {
  calculateCostFromBlocks,
  calculateQuantityFromBlocks,
  detectClashesFromBlocks,
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
    return calculateQuantityFromBlocks(blocks);
  }

  async cost(projectId: string) {
    const blocks = await this.loadBlocks(projectId);
    if (!blocks) return null;
    return calculateCostFromBlocks(blocks);
  }

  async clash(projectId: string) {
    const blocks = await this.loadBlocks(projectId);
    if (!blocks) return null;
    return detectClashesFromBlocks(blocks);
  }

  quantityFromBlocks(blocks: Block[]) {
    return calculateQuantityFromBlocks(blocks);
  }

  costFromBlocks(blocks: Block[]) {
    return calculateCostFromBlocks(blocks);
  }

  clashFromBlocks(blocks: Block[]) {
    return detectClashesFromBlocks(blocks);
  }
}
