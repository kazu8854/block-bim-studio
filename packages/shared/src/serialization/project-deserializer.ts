import { ProjectSchema, type Project } from '../models/project.js';

export interface ProjectDeserializer {
  fromJsonString(json: string): Project;
}

export function deserializeProjectFromJson(json: string): Project {
  const parsed: unknown = JSON.parse(json);
  return ProjectSchema.parse(parsed);
}
