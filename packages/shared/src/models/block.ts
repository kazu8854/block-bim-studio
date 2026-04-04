import { z } from 'zod';

export const BlockCategoryEnum = z.enum([
  'structure',
  'opening',
  'equipment',
]);

export const IfcElementTypeEnum = z.enum([
  'IfcWall',
  'IfcColumn',
  'IfcBeam',
  'IfcSlab',
  'IfcWindow',
  'IfcDoor',
  'IfcPipeSegment',
  'IfcDuctSegment',
]);

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const DimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

export const PropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const PropertySetSchema = z.object({
  name: z.string().min(1),
  properties: z.record(z.string(), PropertyValueSchema),
});

export const BlockSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  ifcType: IfcElementTypeEnum,
  category: BlockCategoryEnum,
  position: Vector3Schema,
  rotation: Vector3Schema,
  dimensions: DimensionsSchema,
  propertySets: z.array(PropertySetSchema),
});

export type Block = z.infer<typeof BlockSchema>;
export type Vector3 = z.infer<typeof Vector3Schema>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
export type PropertySet = z.infer<typeof PropertySetSchema>;
export type PropertyValue = z.infer<typeof PropertyValueSchema>;
export type BlockCategory = z.infer<typeof BlockCategoryEnum>;
export type IfcElementType = z.infer<typeof IfcElementTypeEnum>;
