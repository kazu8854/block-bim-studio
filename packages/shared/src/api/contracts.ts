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
import {
  StubLevel0Schema,
  StubLevel2ProjectSchema,
  StubLevel2SimulationSchema,
} from '../models/stub-meta.js';
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
const S2proj = StubLevel2ProjectSchema;
const S2sim = StubLevel2SimulationSchema;

export const UserDetailResponseSchema = UserSchema.merge(S0);

/** REST `/api/projects/*` — Level 2（本実装） */
export const ProjectListResponseSchema = z
  .object({
    items: z.array(ProjectSummarySchema),
  })
  .merge(S2proj);

export const ProjectDetailResponseSchema = ProjectSchema.merge(S2proj);

export const CreateProjectResponseSchema = ProjectSchema.merge(S2proj);

export const ArchiveProjectResponseSchema = ProjectSchema.merge(S2proj);

export const DuplicateProjectResponseSchema = ProjectSchema.merge(S2proj);

/** Agent `GET /project/:id` — Level 2（ProjectUsecase 本実装、`_stub: false`） */
export const AgentProjectDetailResponseSchema = ProjectSchema.merge(S2proj);

export const QuantitySimulationResponseSchema =
  QuantityResultSchema.merge(S2sim);

export const CostSimulationResponseSchema = CostResultSchema.merge(S2sim);

export const ClashSimulationResponseSchema = ClashResultSchema.merge(S2sim);

export const GanttResponseSchema = GanttChartDataSchema.merge(S2sim);

export const CriticalPathResponseSchema =
  CriticalPathResultSchema.merge(S2sim);

export const StructureCheckResponseSchema =
  StructureCheckResultSchema.merge(S2sim);

export const RegulationCheckResponseSchema =
  RegulationCheckResultSchema.merge(S2sim);

export const EnvironmentCheckResponseSchema =
  EnvironmentSimulationResultSchema.merge(S2sim);

export const SafetyCheckResponseSchema =
  SafetySimulationResultSchema.merge(S2sim);

export const AiSuggestStructureResponseSchema = z
  .object({
    suggestions: z.array(StructureSuggestionSchema),
    message: z.string().optional(),
  })
  .merge(S2sim);

export const AiGenerateFromTextResponseSchema =
  BlockGenerationResultSchema.merge(S2sim);

export const AiGenerateFromImageResponseSchema =
  ImageAnalysisResultSchema.merge(S2sim);

export const IfcExportResponseSchema = IfcExportResultSchema.merge(S2sim);

export const IfcImportResponseSchema = IfcImportResultSchema.merge(S2sim);

export const DashboardResponseSchema = DashboardDataSchema.merge(S2sim);

export const CompareResponseSchema = ProjectCompareResultSchema.merge(S2sim);

/** Agent API: プロジェクト一覧（Level 2） */
export const AgentProjectListResponseSchema = z
  .object({
    projects: z.array(ProjectSummarySchema),
  })
  .merge(S2proj);
