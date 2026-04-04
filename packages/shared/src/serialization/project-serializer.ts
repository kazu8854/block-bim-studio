import { ProjectSchema, type Project } from '../models/project.js';
import { deserializeProjectFromJson } from './project-deserializer.js';

export interface ProjectSerializer {
  toJsonString(project: Project): string;
}

/** `ProjectSchema` に準拠した JSON 文字列を生成する（Level 2） */
export function serializeProjectToJson(project: Project): string {
  const validated = ProjectSchema.parse(project);
  return JSON.stringify(validated);
}

/** シリアライズ → パースのラウンドトリップ（要件 14.3） */
export function roundTripProjectThroughJson(project: Project): Project {
  return deserializeProjectFromJson(serializeProjectToJson(project));
}
