import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IfcAPI } from 'web-ifc';

let apiInstance: IfcAPI | null = null;
let initPromise: Promise<IfcAPI> | null = null;

/**
 * web-ifc WASM の初期化（Node / Vitest / バックエンド用）
 */
export async function getIfcApi(): Promise<IfcAPI> {
  if (apiInstance) return apiInstance;
  if (!initPromise) {
    initPromise = (async () => {
      const { IfcAPI } = await import('web-ifc');
      const wasmDir = join(
        dirname(fileURLToPath(import.meta.url)),
        '../../../../node_modules/web-ifc',
      );
      const api = new IfcAPI();
      await api.Init((path: string) => join(wasmDir, path), true);
      apiInstance = api;
      return api;
    })();
  }
  return initPromise;
}
