import type { Block, Project } from '@block-bim-studio/shared';
import { MockAIAdapter } from '../src/adapters/mock-ai-adapter.js';
import { MockDbAdapter } from '../src/adapters/mock-db-adapter.js';
import { createApp } from '../src/app.js';

export const sampleBlock: Block = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Stub Wall',
  ifcType: 'IfcWall',
  category: 'structure',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  dimensions: { width: 1, height: 2, depth: 0.2 },
  propertySets: [
    {
      name: 'Pset_Common',
      properties: { Material: 'concrete' },
    },
  ],
};

export function createTestApp() {
  return createApp({
    db: new MockDbAdapter(),
    ai: new MockAIAdapter(),
  });
}

export async function createTestProject(app: ReturnType<typeof createTestApp>): Promise<Project> {
  const res = await app.request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Contract Test Project' }),
  });
  const data = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  const { _stub: _s, _stubLevel: _l, ...project } = data;
  return project as Project;
}
