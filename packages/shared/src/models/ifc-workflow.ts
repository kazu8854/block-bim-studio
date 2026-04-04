import { z } from 'zod';

/** IFC エクスポート API の結果（バイナリは Base64） */
export const IfcExportResultSchema = z.object({
  projectId: z.string().uuid(),
  filename: z.string(),
  ifcBase64: z.string(),
});

export type IfcExportResult = z.infer<typeof IfcExportResultSchema>;
