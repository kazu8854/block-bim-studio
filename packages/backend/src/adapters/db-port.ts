import type {
  Project,
  ProjectMetadata,
  ProjectSummary,
  User,
} from '@block-bim-studio/shared';

export interface DbPort {
  getUser(id: string): Promise<User | null>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: {
    name: string;
    metadata?: ProjectMetadata;
  }): Promise<Project>;
  updateProject(project: Project): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listProjects(): Promise<ProjectSummary[]>;
  duplicateProject(id: string): Promise<Project>;
}
