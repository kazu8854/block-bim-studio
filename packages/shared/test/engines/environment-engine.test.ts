import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/models/block.js';
import { environmentSimulateFromBlocks } from '../../src/engines/environment-engine.js';

describe('environment-engine', () => {
  it('窓なしメッセージ', () => {
    const wall: Block = {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'W',
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 4, height: 3, depth: 0.2 },
      propertySets: [],
    };
    const r = environmentSimulateFromBlocks([wall]);
    expect(r.windowDetails).toHaveLength(0);
    expect(r.message).toMatch(/窓/);
    expect(r.solarGainKwh).toBe(0);
  });

  it('窓の日射と外皮熱損失', () => {
    const win: Block = {
      id: '10000000-0000-4000-8000-000000000002',
      name: 'Win',
      ifcType: 'IfcWindow',
      category: 'opening',
      position: { x: 0, y: 1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 2, height: 1.5, depth: 0.1 },
      propertySets: [],
    };
    const wall: Block = {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'W',
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: 3, y: 1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 3, height: 3, depth: 0.2 },
      propertySets: [{ name: 'Pset_Material', properties: { Thickness: 0.2 } }],
    };
    const r = environmentSimulateFromBlocks([win, wall]);
    expect(r.windowDetails).toHaveLength(1);
    expect(r.windowDetails[0]!.annualIrradianceKwhM2).toBeGreaterThan(600);
    expect(r.solarGainKwh).toBeGreaterThan(0);
    expect(r.envelopeDetails.length).toBeGreaterThanOrEqual(1);
    expect(r.heatLossKwh).toBeGreaterThan(0);
  });
});
