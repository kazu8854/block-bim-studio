import type { ProjectCompareResult } from '@block-bim-studio/shared';
import { fetchJson } from '@/api/http';

export async function compareProjects(
  projectIds: string[],
): Promise<ProjectCompareResult> {
  return fetchJson<ProjectCompareResult>('/api/compare', {
    method: 'POST',
    body: JSON.stringify({ projectIds }),
  });
}
