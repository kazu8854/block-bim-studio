import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/models/block.js';
import type { ProjectMetadata } from '../../src/models/project.js';
import { regulationCheckFromBlocks } from '../../src/engines/regulation-check-engine.js';

const wall = (id: string, w: number, d: number): Block => ({
  id,
  name: 'W',
  ifcType: 'IfcWall',
  category: 'structure',
  position: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  dimensions: { width: w, height: 2, depth: d },
  propertySets: [],
});

describe('regulation-check-engine', () => {
  it('敷地面積未設定', () => {
    const r = regulationCheckFromBlocks([wall('10000000-0000-4000-8000-000000000001', 2, 2)], {});
    expect(r.allCompliant).toBe(false);
    expect(r.message).toMatch(/敷地/);
    expect(r.items).toHaveLength(0);
  });

  it('上限未設定かつ用途地域もなし', () => {
    const meta: ProjectMetadata = { siteArea: 400 };
    const r = regulationCheckFromBlocks([], meta);
    expect(r.allCompliant).toBe(false);
    expect(r.message).toMatch(/上限/);
  });

  it('建ぺい率・容積率 適合', () => {
    const meta: ProjectMetadata = {
      siteArea: 500,
      buildingCoverageLimit: 80,
      floorAreaRatioLimit: 500,
    };
    const blocks = [wall('10000000-0000-4000-8000-000000000001', 4, 4)];
    const r = regulationCheckFromBlocks(blocks, meta);
    const cov = r.items.find((i) => i.name === '建ぺい率');
    const far = r.items.find((i) => i.name === '容積率');
    expect(cov?.compliant).toBe(true);
    expect(far?.compliant).toBe(true);
    expect(r.allCompliant).toBe(true);
  });

  it('建ぺい率 不適合', () => {
    const meta: ProjectMetadata = {
      siteArea: 100,
      buildingCoverageLimit: 10,
      floorAreaRatioLimit: 500,
    };
    const blocks = [wall('10000000-0000-4000-8000-000000000001', 8, 8)];
    const r = regulationCheckFromBlocks(blocks, meta);
    const cov = r.items.find((i) => i.name === '建ぺい率');
    expect(cov?.compliant).toBe(false);
  });

  it('廊下幅 不適合', () => {
    const meta: ProjectMetadata = {
      siteArea: 200,
      buildingCoverageLimit: 80,
      floorAreaRatioLimit: 500,
    };
    const corridor: Block = {
      id: '10000000-0000-4000-8000-000000000002',
      name: '廊下A',
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 0.8, height: 2, depth: 6 },
      propertySets: [],
    };
    const r = regulationCheckFromBlocks(
      [wall('10000000-0000-4000-8000-000000000001', 1, 1), corridor],
      meta,
    );
    const cor = r.items.find((i) => i.name.includes('避難経路'));
    expect(cor?.compliant).toBe(false);
  });
});
