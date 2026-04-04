import { describe, expect, it } from 'vitest';
import { parseIfc } from '../../src/ifc/ifc-parser.js';

describe('IFC parser (F1)', () => {
  it('rejects empty buffer', async () => {
    await expect(parseIfc(new Uint8Array())).rejects.toThrow(/空/);
  });

  it('rejects invalid IFC bytes', async () => {
    const almost = new TextEncoder().encode(
      'ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n',
    );
    await expect(parseIfc(almost)).rejects.toThrow(/IFC/);
  });
});
