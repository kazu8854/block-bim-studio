import {
  AgentProjectDetailResponseSchema,
  AgentProjectListResponseSchema,
  AiGenerateFromTextResponseSchema,
  BlockSchema,
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  ProjectMetadataSchema,
  QuantitySimulationResponseSchema,
  RegulationCheckResponseSchema,
  StructureCheckResponseSchema,
  StructureSuggestionSchema,
} from '@block-bim-studio/shared';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { AIUsecase } from '../usecases/ai-usecase.js';
import type { CheckUsecase } from '../usecases/check-usecase.js';
import type { ProjectUsecase } from '../usecases/project-usecase.js';
import type { SimulationUsecase } from '../usecases/simulation-usecase.js';
import { STUB_LEVEL_0, STUB_LEVEL_2_PROJECT } from './stub.js';

const BlocksBodySchema = z.object({
  blocks: z.array(BlockSchema),
});

const RegulationBodySchema = z.object({
  blocks: z.array(BlockSchema),
  metadata: ProjectMetadataSchema.optional(),
});

const GenerateBlocksBodySchema = z.object({
  description: z.string().min(1),
});

const AgentSuggestResponseSchema = z
  .object({
    suggestions: z.array(StructureSuggestionSchema),
  })
  .merge(
    z.object({
      _stub: z.literal(true),
      _stubLevel: z.literal(0),
    }),
  );

export type AgentAppDeps = {
  simulationUsecase: SimulationUsecase;
  checkUsecase: CheckUsecase;
  aiUsecase: AIUsecase;
  projectUsecase: ProjectUsecase;
};

export function createAgentApp(deps: AgentAppDeps) {
  const app = new OpenAPIHono();

  const quantityRoute = createRoute({
    method: 'post',
    path: '/quantity',
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Quantity result (stub)',
        content: {
          'application/json': {
            schema: QuantitySimulationResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(quantityRoute, (c) => {
    const { blocks } = c.req.valid('json');
    const raw = { ...deps.simulationUsecase.quantityFromBlocks(blocks), ...STUB_LEVEL_0 };
    return c.json(QuantitySimulationResponseSchema.parse(raw), 200);
  });

  const costRoute = createRoute({
    method: 'post',
    path: '/cost',
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Cost result (stub)',
        content: {
          'application/json': {
            schema: CostSimulationResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(costRoute, (c) => {
    const { blocks } = c.req.valid('json');
    const raw = { ...deps.simulationUsecase.costFromBlocks(blocks), ...STUB_LEVEL_0 };
    return c.json(CostSimulationResponseSchema.parse(raw), 200);
  });

  const clashRoute = createRoute({
    method: 'post',
    path: '/clash',
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Clash result (stub)',
        content: {
          'application/json': {
            schema: ClashSimulationResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(clashRoute, (c) => {
    const { blocks } = c.req.valid('json');
    const raw = { ...deps.simulationUsecase.clashFromBlocks(blocks), ...STUB_LEVEL_0 };
    return c.json(ClashSimulationResponseSchema.parse(raw), 200);
  });

  const structureRoute = createRoute({
    method: 'post',
    path: '/structure-check',
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Structure check (stub)',
        content: {
          'application/json': {
            schema: StructureCheckResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(structureRoute, (c) => {
    const { blocks } = c.req.valid('json');
    const raw = { ...deps.checkUsecase.structureFromBlocks(blocks), ...STUB_LEVEL_0 };
    return c.json(StructureCheckResponseSchema.parse(raw), 200);
  });

  const regulationRoute = createRoute({
    method: 'post',
    path: '/regulation-check',
    request: {
      body: {
        content: {
          'application/json': {
            schema: RegulationBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Regulation check (stub)',
        content: {
          'application/json': {
            schema: RegulationCheckResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(regulationRoute, (c) => {
    const { blocks, metadata } = c.req.valid('json');
    const raw = {
      ...deps.checkUsecase.regulationFromBlocks(blocks, metadata ?? {}),
      ...STUB_LEVEL_0,
    };
    return c.json(RegulationCheckResponseSchema.parse(raw), 200);
  });

  const suggestRoute = createRoute({
    method: 'post',
    path: '/suggest-structure',
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Structure suggestions (stub)',
        content: {
          'application/json': {
            schema: AgentSuggestResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(suggestRoute, async (c) => {
    const { blocks } = c.req.valid('json');
    const suggestions = await deps.aiUsecase.suggestFromBlocks(blocks);
    const raw = { suggestions, ...STUB_LEVEL_0 };
    return c.json(AgentSuggestResponseSchema.parse(raw), 200);
  });

  const generateRoute = createRoute({
    method: 'post',
    path: '/generate-blocks',
    request: {
      body: {
        content: {
          'application/json': {
            schema: GenerateBlocksBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated blocks (stub)',
        content: {
          'application/json': {
            schema: AiGenerateFromTextResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(generateRoute, async (c) => {
    const { description } = c.req.valid('json');
    const result = await deps.aiUsecase.generateFromText(description);
    const raw = { ...result, ...STUB_LEVEL_0 };
    return c.json(AiGenerateFromTextResponseSchema.parse(raw), 200);
  });

  const projectGetRoute = createRoute({
    method: 'get',
    path: '/project/{id}',
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Project detail (stub)',
        content: {
          'application/json': {
            schema: AgentProjectDetailResponseSchema,
          },
        },
      },
      404: {
        description: 'Not found',
      },
    },
  });

  app.openapi(projectGetRoute, async (c) => {
    const { id } = c.req.valid('param');
    const project = await deps.projectUsecase.get(id);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    const raw = { ...project, ...STUB_LEVEL_2_PROJECT };
    return c.json(AgentProjectDetailResponseSchema.parse(raw), 200);
  });

  const projectsListRoute = createRoute({
    method: 'get',
    path: '/projects',
    responses: {
      200: {
        description: 'Project list (stub)',
        content: {
          'application/json': {
            schema: AgentProjectListResponseSchema,
          },
        },
      },
    },
  });

  app.openapi(projectsListRoute, async (c) => {
    const summaries = await deps.projectUsecase.list();
    const raw = { projects: summaries, ...STUB_LEVEL_2_PROJECT };
    return c.json(AgentProjectListResponseSchema.parse(raw), 200);
  });

  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'IFC Lego BIM Simulator - Agent API',
      version: '1.0.0',
    },
  });

  return app;
}
