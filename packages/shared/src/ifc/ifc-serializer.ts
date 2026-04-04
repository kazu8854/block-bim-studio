import type { Project } from '../models/project.js';
import type { IfcBinary } from './ifc-types.js';

export interface IfcSerializer {
  serialize(project: Project): Promise<IfcBinary>;
}

export async function serializeProjectToIfcLevel0(
  _project: Project,
): Promise<IfcBinary> {
  return new Uint8Array(0);
}
