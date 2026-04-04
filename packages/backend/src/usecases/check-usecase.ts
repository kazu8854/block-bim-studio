import type { Block, ProjectMetadata } from '@block-bim-studio/shared';
import {
  environmentSimulateLevel0,
  regulationCheckLevel0,
  safetyAnalyzeLevel0,
  structureCheckLevel0,
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
    return structureCheckLevel0(p.blocks);
  }

  async regulation(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return regulationCheckLevel0(p.blocks, p.metadata);
  }

  async environment(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return environmentSimulateLevel0(p.blocks);
  }

  async safety(projectId: string) {
    const p = await this.loadProject(projectId);
    if (!p) return null;
    return safetyAnalyzeLevel0(p.blocks, p.schedules);
  }

  structureFromBlocks(blocks: Block[]) {
    return structureCheckLevel0(blocks);
  }

  regulationFromBlocks(blocks: Block[], metadata: ProjectMetadata) {
    return regulationCheckLevel0(blocks, metadata);
  }
}
