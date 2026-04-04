import { z } from 'zod';
import {
  BlockGenerationResultSchema,
  ImageAnalysisResultSchema,
  StructureSuggestionSchema,
} from '../models/ai-result.js';
import { ProjectCompareResultSchema } from '../models/compare.js';
import { DashboardDataSchema } from '../models/dashboard.js';
import { GanttChartDataSchema } from '../models/gantt.js';
import {
  EnvironmentSimulationResultSchema,
  SafetySimulationResultSchema,
} from '../models/check-extra.js';
import { IfcExportResultSchema } from '../models/ifc-workflow.js';
import { IfcImportResultSchema } from '../models/ifc-import.js';
import { ProjectSchema, ProjectSummarySchema } from '../models/project.js';
import { StubLevel0Schema } from '../models/stub-meta.js';
import {
  ClashResultSchema,
  CostResultSchema,
  CriticalPathResultSchema,
  QuantityResultSchema,
  RegulationCheckResultSchema,
  StructureCheckResultSchema,
} from '../models/simulation-result.js';
import { UserSchema } from '../models/user.js';

const S0 = StubLevel0Schema;

export const UserDetailResponseSchema = UserSchema.merge(S0);

export const ProjectListResponseSchema = z
  .object({
    items: z.array(ProjectSummarySchema),
  })
  .merge(S0);

export const ProjectDetailResponseSchema = ProjectSchema.merge(S0);

export const CreateProjectResponseSchema = ProjectSchema.merge(S0);

export const ArchiveProjectResponseSchema = ProjectSchema.merge(S0);

export const DuplicateProjectResponseSchema = ProjectSchema.merge(S0);

export const QuantitySimulationResponseSchema =
  QuantityResultSchema.merge(S0);

export const CostSimulationResponseSchema = CostResultSchema.merge(S0);

export const ClashSimulationResponseSchema = ClashResultSchema.merge(S0);

export const GanttResponseSchema = GanttChartDataSchema.merge(S0);

export const CriticalPathResponseSchema =
  CriticalPathResultSchema.merge(S0);

export const StructureCheckResponseSchema =
  StructureCheckResultSchema.merge(S0);

export const RegulationCheckResponseSchema =
  RegulationCheckResultSchema.merge(S0);

export const EnvironmentCheckResponseSchema =
  EnvironmentSimulationResultSchema.merge(S0);

export const SafetyCheckResponseSchema =
  SafetySimulationResultSchema.merge(S0);

export const AiSuggestStructureResponseSchema = z
  .object({
    suggestions: z.array(StructureSuggestionSchema),
  })
  .merge(S0);

export const AiGenerateFromTextResponseSchema =
  BlockGenerationResultSchema.merge(S0);

export const AiGenerateFromImageResponseSchema =
  ImageAnalysisResultSchema.merge(S0);

export const IfcExportResponseSchema = IfcExportResultSchema.merge(S0);

export const IfcImportResponseSchema = IfcImportResultSchema.merge(S0);

export const DashboardResponseSchema = DashboardDataSchema.merge(S0);

export const CompareResponseSchema = ProjectCompareResultSchema.merge(S0);

/** Agent API: プロジェクト一覧 */
export const AgentProjectListResponseSchema = z
  .object({
    projects: z.array(ProjectSummarySchema),
  })
  .merge(S0);
