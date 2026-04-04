import { hc } from 'hono/client';

function baseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5173';
}

/**
 * `createApp` の戻り型では `.route()` チェーンのパスが推論されないため、
 * プロジェクト API 部分のクライアント形状を明示する（Hono RPC パターン）。
 */
export type ProjectsHonoClient = {
  api: {
    projects: {
      $get: () => Promise<Response>;
      $post: (args: {
        json: { name: string; metadata?: Record<string, unknown> };
      }) => Promise<Response>;
      ':id': {
        $get: (args: { param: { id: string } }) => Promise<Response>;
        $put: (args: { param: { id: string }; json: unknown }) => Promise<Response>;
        $delete: (args: { param: { id: string } }) => Promise<Response>;
        duplicate: {
          $post: (args: { param: { id: string } }) => Promise<Response>;
        };
        archive: {
          $patch: (args: {
            param: { id: string };
            json: { status: string };
          }) => Promise<Response>;
        };
      };
    };
  };
};

export const apiClient = hc(baseUrl()) as unknown as ProjectsHonoClient;
