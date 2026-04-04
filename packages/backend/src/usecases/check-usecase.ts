import type { Block, ProjectMetadata } from '@block-bim-studio/shared';
import {
  environmentSimulateFromBlocks,
  regulationCheckFromBlocks,
  safetyAnalyzeFromBlocks,
  structureCheckFromBlocks,
} from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class CheckUsecase {
  constructor(private readonly db: DbPort) {}

  private async loadProject(projectId: string) {
    return this.db.getProject(projectId);
  }

  async structure(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return structureCheckFromBlocks(p.blocks);
  }

  async regulation(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return regulationCheckFromBlocks(p.blocks, p.metadata);
  }

  async environment(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return environmentSimulateFromBlocks(p.blocks);
  }

  async safety(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return safetyAnalyzeFromBlocks(p.blocks, p.schedules);
  }

  structureFromBlocks(blocks: Block[]) {
    return structureCheckFromBlocks(blocks);
  }

  regulationFromBlocks(blocks: Block[], metadata: ProjectMetadata) {
    return regulationCheckFromBlocks(blocks, metadata);
  }
}
