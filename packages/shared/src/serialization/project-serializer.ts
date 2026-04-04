import type { Project } from '../models/project.js';

export interface ProjectSerializer {
  toJsonString(project: Project): string;
}

export function serializeProjectToJson(project: Project): string {
  return JSON.stringify(project);
}
