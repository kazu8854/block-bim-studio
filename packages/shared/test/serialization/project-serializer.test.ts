import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/models/project.js';
import { deserializeProjectFromJson } from '../../src/serialization/project-deserializer.js';
import {
  roundTripProjectThroughJson,
  serializeProjectToJson,
} from '../../src/serialization/project-serializer.js';

const sampleProject: Project = {
  id: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
  name: 'Round-trip Project',
  status: 'active',
  metadata: { siteArea: 120, zoneType: 'residential' },
  blocks: [
    {
      id: 'bbbbbbbb-cccc-4ddd-eeee-ffffffffffff',
      name: 'Wall A',
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 2, height: 3, depth: 0.2 },
      propertySets: [
        { name: 'Pset_Common', properties: { FireRating: '60min', Cost: 1000 } },
      ],
    },
  ],
  schedules: [
    {
      blockId: 'bbbbbbbb-cccc-4ddd-eeee-ffffffffffff',
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-06-10T00:00:00.000Z',
      durationDays: 10,
      dependencies: [],
      status: 'not_started',
    },
  ],
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-15T12:30:00.000Z',
};

describe('project JSON serialization (A2)', () => {
  it('round-trips through JSON with equivalent project data', () => {
    expect(roundTripProjectThroughJson(sampleProject)).toEqual(sampleProject);
  });

  it('deserialize(serialize(p)) matches parse of raw JSON', () => {
    const json = serializeProjectToJson(sampleProject);
    expect(deserializeProjectFromJson(json)).toEqual(sampleProject);
  });

  it('serialize validates with ProjectSchema', () => {
    const bad = { ...sampleProject, name: '' };
    expect(() => serializeProjectToJson(bad)).toThrow();
  });
});
