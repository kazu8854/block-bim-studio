import type { DashboardData } from '@block-bim-studio/shared';
import { fetchJson } from '@/api/http';

export async function getDashboardData(projectId: string): Promise<DashboardData> {
  return fetchJson<DashboardData>(`/api/dashboard/${projectId}`);
}
