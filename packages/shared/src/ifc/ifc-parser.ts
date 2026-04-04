import type { Block } from '../models/block.js';
import type { IfcBinary } from './ifc-types.js';

export interface IfcParser {
  parse(buffer: IfcBinary): Promise<{ blocks: Block[]; warnings: string[] }>;
}

export async function parseIfcLevel0(
  _buffer: IfcBinary,
): Promise<{ blocks: Block[]; warnings: string[] }> {
  return { blocks: [], warnings: ['ifc-parser-stub'] };
}
