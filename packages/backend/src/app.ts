import { Hono } from 'hono';
import type { AIPort } from './adapters/ai-port.js';
import type { DbPort } from './adapters/db-port.js';
import { createAgentApp } from './api/agent.js';
import { createAiApp } from './api/ai.js';
import { createCheckApp } from './api/check.js';
import { createCompareApp } from './api/compare.js';
import { createDashboardApp } from './api/dashboard.js';
import { createIfcApp } from './api/ifc.js';
import { createProjectsApp } from './api/projects.js';
import { createScheduleApp } from './api/schedule.js';
import { createSimulationApp } from './api/simulation.js';
import { createUsersApp } from './api/users.js';
import { AIUsecase } from './usecases/ai-usecase.js';
import { CheckUsecase } from './usecases/check-usecase.js';
import { DashboardUsecase } from './usecases/dashboard-usecase.js';
import { IfcUsecase } from './usecases/ifc-usecase.js';
import { ProjectUsecase } from './usecases/project-usecase.js';
import { ScheduleUsecase } from './usecases/schedule-usecase.js';
import { SimulationUsecase } from './usecases/simulation-usecase.js';
import { UserUsecase } from './usecases/user-usecase.js';

export type AppDeps = {
  db: DbPort;
  ai: AIPort;
};

export function createApp(deps: AppDeps) {
  const userUsecase = new UserUsecase(deps.db);
  const projectUsecase = new ProjectUsecase(deps.db);
  const simulationUsecase = new SimulationUsecase(deps.db);
  const scheduleUsecase = new ScheduleUsecase(deps.db);
  const checkUsecase = new CheckUsecase(deps.db);
  const aiUsecase = new AIUsecase(deps.ai, deps.db);
  const ifcUsecase = new IfcUsecase(deps.db);
  const dashboardUsecase = new DashboardUsecase(deps.db);

  const app = new Hono();

  app.route('/api/users', createUsersApp(userUsecase));
  app.route('/api/projects', createProjectsApp(projectUsecase));
  app.route('/api/simulation', createSimulationApp(simulationUsecase));
  app.route('/api/schedule', createScheduleApp(scheduleUsecase));
  app.route('/api/check', createCheckApp(checkUsecase));
  app.route('/api/ai', createAiApp(aiUsecase));
  app.route('/api/ifc', createIfcApp(ifcUsecase));
  app.route('/api/dashboard', createDashboardApp(dashboardUsecase));
  app.route('/api/compare', createCompareApp(dashboardUsecase));
  app.route(
    '/api/agent',
    createAgentApp({
      simulationUsecase,
      checkUsecase,
      aiUsecase,
      projectUsecase,
    }),
  );

  return app;
}
