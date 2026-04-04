/**
 * ローカル開発用エントリ。MOCK_AWS 前提でインメモリ DB と Mock AI で API を起動する。
 * リポジトリルートから `npm run dev:mock` を実行することを想定。
 */
process.env.MOCK_AWS ??= 'true';

import { serve } from '@hono/node-server';
import { createAIAdapter } from './adapters/ai-adapter-factory.js';
import { MockDbAdapter } from './adapters/mock-db-adapter.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
const hostname = process.env.HOST ?? '0.0.0.0';

async function main() {
  const ai = await createAIAdapter();
  const app = createApp({ db: new MockDbAdapter(), ai });

  serve(
    {
      fetch: app.fetch,
      port,
      hostname,
    },
    (info) => {
      const host =
        hostname === '0.0.0.0' ? 'localhost' : hostname;
      console.log(
        `[dev:mock] MOCK_AWS=${process.env.MOCK_AWS} → http://${host}:${String(info.port)}`,
      );
    },
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
