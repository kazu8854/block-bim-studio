import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/models/block.js';
import type { Project } from '../../src/models/project.js';
import { parseIfc } from '../../src/ifc/ifc-parser.js';
import { serializeProjectToIfc } from '../../src/ifc/ifc-serializer.js';
import { buildPropertySetsForNewIfcBlock } from '../../src/utils/new-block-property-sets.js';

const dims = { width: 2, height: 2.5, depth: 0.3 };

const wallBlock: Block = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Wall A',
  ifcType: 'IfcWall',
  category: 'structure',
  position: { x: 1, y: 0.5, z: -0.25 },
  rotation: { x: 0, y: Math.PI / 4, z: 0 },
  dimensions: dims,
  propertySets: buildPropertySetsForNewIfcBlock('IfcWall', dims),
};

const minimalProject: Project = {
  id: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
  name: 'IFC Test',
  status: 'active',
  metadata: {},
  blocks: [wallBlock],
  schedules: [],
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-15T12:30:00.000Z',
};

describe('IFC serializer + parser (F1)', () => {
  it(
    'export → import round-trip restores block identity, placement, and size',
    async () => {
      const bin = await serializeProjectToIfc(minimalProject);
      const { blocks, warnings } = await parseIfc(bin);
      expect(warnings.length).toBe(0);
      expect(blocks).toHaveLength(1);
      const b = blocks[0]!;
      expect(b.id).toBe(wallBlock.id);
      expect(b.name).toBe(wallBlock.name);
      expect(b.ifcType).toBe(wallBlock.ifcType);
      expect(b.category).toBe(wallBlock.category);
      expect(b.position.x).toBeCloseTo(wallBlock.position.x, 4);
      expect(b.position.y).toBeCloseTo(wallBlock.position.y, 4);
      expect(b.position.z).toBeCloseTo(wallBlock.position.z, 4);
      expect(b.rotation.y).toBeCloseTo(wallBlock.rotation.y, 4);
      expect(b.dimensions.width).toBeCloseTo(wallBlock.dimensions.width, 4);
      expect(b.dimensions.height).toBeCloseTo(wallBlock.dimensions.height, 4);
      expect(b.dimensions.depth).toBeCloseTo(wallBlock.dimensions.depth, 4);
    },
    60_000,
  );

  it('empty project yields no blocks', async () => {
    const empty: Project = { ...minimalProject, blocks: [] };
    const bin = await serializeProjectToIfc(empty);
    const { blocks } = await parseIfc(bin);
    expect(blocks).toHaveLength(0);
  });
});
