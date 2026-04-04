import type { Project, ProjectMetadata, ProjectSummary } from '@block-bim-studio/shared';
import type { User } from '@block-bim-studio/shared';
import type { DbPort } from './db-port.js';

function toSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    blockCount: p.blocks.length,
    updatedAt: p.updatedAt,
  };
}

function newProject(name: string, metadata: ProjectMetadata = {}): Project {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    status: 'draft',
    metadata,
    blocks: [],
    schedules: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** 複製時: ブロック ID を振り直し、schedules / dependencies の blockId を対応付ける */
function remapProjectForDuplicate(src: Project): Project {
  const blockIdMap = new Map<string, string>();
  const blocks = src.blocks.map((b) => {
    const nid = crypto.randomUUID();
    blockIdMap.set(b.id, nid);
    return { ...b, id: nid };
  });
  const mapId = (blockId: string) => blockIdMap.get(blockId) ?? blockId;
  const schedules = src.schedules.map((s) => ({
    ...s,
    blockId: mapId(s.blockId),
    dependencies: s.dependencies.map((d) => ({
      ...d,
      blockId: mapId(d.blockId),
    })),
  }));
  const now = new Date().toISOString();
  return {
    ...src,
    id: crypto.randomUUID(),
    name: `${src.name} (copy)`,
    blocks,
    schedules,
    createdAt: now,
    updatedAt: now,
  };
}

export class MockDbAdapter implements DbPort {
  private readonly users = new Map<string, User>();
  private readonly projects = new Map<string, Project>();

  constructor() {
    const demoUser: User = {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'demo@example.com',
      name: 'Demo User',
    };
    this.users.set(demoUser.id, demoUser);
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async createProject(input: {
    name: string;
    metadata?: ProjectMetadata;
  }): Promise<Project> {
    const p = newProject(input.name, input.metadata ?? {});
    this.projects.set(p.id, p);
    return p;
  }

  async updateProject(project: Project): Promise<Project> {
    if (!this.projects.has(project.id)) {
      throw new Error('PROJECT_NOT_FOUND');
    }
    const next: Project = { ...project, updatedAt: new Date().toISOString() };
    this.projects.set(next.id, next);
    return next;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async listProjects(): Promise<ProjectSummary[]> {
    return [...this.projects.values()]
      .map(toSummary)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
  }

  async duplicateProject(id: string): Promise<Project> {
    const src = this.projects.get(id);
    if (!src) {
      throw new Error('PROJECT_NOT_FOUND');
    }
    const copy = remapProjectForDuplicate(src);
    this.projects.set(copy.id, copy);
    return copy;
  }
}
