import { parseIfcLevel0, serializeProjectToIfcLevel0 } from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class IfcUsecase {
  constructor(private readonly db: DbPort) {}

  async exportProject(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    const bin = await serializeProjectToIfcLevel0(p);
    const ifcBase64 = Buffer.from(bin).toString('base64');
    return {
      projectId: p.id,
      filename: `${p.name}.ifc`,
      ifcBase64,
    };
  }

  async importIfc(ifcBase64: string) {
    const buffer = Buffer.from(ifcBase64, 'base64');
    return parseIfcLevel0(new Uint8Array(buffer));
  }
}
