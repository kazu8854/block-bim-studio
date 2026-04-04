# 技術設計書: IFC レゴ BIM シミュレーター — API 設計

## バックエンド API 設計

既存の Hono ルーティングパターンを踏襲し、ドメインごとにサブルーターを定義する。

```typescript
// packages/backend/src/index.ts
const routes = app
  .route('/api/users', usersApp)          // 既存
  .route('/api/projects', projectsApp)    // プロジェクト CRUD
  .route('/api/simulation', simulationApp) // シミュレーション実行
  .route('/api/schedule', scheduleApp)    // 工程管理
  .route('/api/check', checkApp)          // 構造・法規チェック
  .route('/api/ai', aiApp)               // AI 連携（フロントエンド向け）
  .route('/api/ifc', ifcApp)             // IFC 入出力
  .route('/api/dashboard', dashboardApp)  // ダッシュボード集計
  .route('/api/compare', compareApp)      // プロジェクト比較
  .route('/api/agent', agentApp);         // Agent 専用（フラット JSON）
```

### API エンドポイント一覧

#### プロジェクト管理 (P1)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| GET | `/api/projects` | プロジェクト一覧取得 | 13, 24 |
| POST | `/api/projects` | プロジェクト新規作成 | 24 |
| GET | `/api/projects/:id` | プロジェクト詳細取得 | 13 |
| PUT | `/api/projects/:id` | プロジェクト更新（保存） | 13 |
| DELETE | `/api/projects/:id` | プロジェクト削除 | 24 |
| POST | `/api/projects/:id/duplicate` | プロジェクト複製 | 24 |
| PATCH | `/api/projects/:id/archive` | アーカイブ状態変更 | 24 |

#### シミュレーション (P2)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| POST | `/api/simulation/quantity` | 数量算出 | 8 |
| POST | `/api/simulation/cost` | コスト概算 | 9 |
| POST | `/api/simulation/clash` | 干渉チェック | 10 |

#### 工程管理 (P2-P3)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| POST | `/api/schedule/gantt` | ガントチャートデータ生成 | 5 |
| POST | `/api/schedule/critical-path` | クリティカルパス分析 | 6 |

#### チェック (P3)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| POST | `/api/check/structure` | 構造チェック | 18 |
| POST | `/api/check/regulation` | 法規チェック | 19 |
| POST | `/api/check/environment` | 環境シミュレーション | 20 |
| POST | `/api/check/safety` | 安全管理シミュレーション | 21 |

#### AI 連携 (P3-P4)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| POST | `/api/ai/suggest-structure` | AI 構造提案 | 15 |
| POST | `/api/ai/generate-from-text` | 自然言語モデリング | 16 |
| POST | `/api/ai/generate-from-image` | 画像からブロック生成 | 17 |

#### IFC 入出力 (P3)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| POST | `/api/ifc/export/:projectId` | IFC エクスポート | 11 |
| POST | `/api/ifc/import` | IFC インポート | 12 |

#### ダッシュボード・比較 (P3-P4)

| メソッド | パス | 説明 | 要件 |
|----------|------|------|------|
| GET | `/api/dashboard/:projectId` | ダッシュボードデータ取得 | 22 |
| POST | `/api/compare` | 複数プロジェクト比較 | 23 |

#### Agent 専用エンドポイント (P3)

AI エージェント（Bedrock Agent / MCP クライアント）が呼び出しやすいシンプルなフラット JSON エンドポイント。既存の Usecase をそのまま再利用し、Agent 向けにシンプルな I/F を提供する薄いレイヤーとして実装する。`@hono/zod-openapi` により OpenAPI スキーマが自動生成され、Bedrock Agent の Action Group 定義や MCP ツール定義に直接利用可能。

| メソッド | パス | 説明 | 再利用 Usecase |
|----------|------|------|----------------|
| POST | `/api/agent/quantity` | 数量算出（フラット JSON） | SimulationUsecase |
| POST | `/api/agent/cost` | コスト概算 | SimulationUsecase |
| POST | `/api/agent/clash` | 干渉チェック | SimulationUsecase |
| POST | `/api/agent/structure-check` | 構造チェック | CheckUsecase |
| POST | `/api/agent/regulation-check` | 法規チェック | CheckUsecase |
| POST | `/api/agent/suggest-structure` | AI 構造提案 | AIUsecase |
| POST | `/api/agent/generate-blocks` | 自然言語モデリング | AIUsecase |
| GET | `/api/agent/project/:id` | プロジェクト取得 | ProjectUsecase |
| GET | `/api/agent/projects` | プロジェクト一覧 | ProjectUsecase |

#### OpenAPI スキーマ出力

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/agent/openapi.json` | Agent 専用エンドポイントの OpenAPI 3.0 スキーマ（JSON） |

### AIPort インターフェースと AI アダプター

DB の Port/Adapter パターンと同様に、AI 連携もインターフェースで抽象化する。

```typescript
// packages/backend/src/adapters/ai-port.ts
import { Block, BlockGenerationResult, ImageAnalysisResult, StructureSuggestion } from '@ifc-lego-bim-simulator/shared';

/**
 * AIPort — AI連携の抽象インターフェース。
 * DB Port と同じく、環境に応じてアダプターを差し替え可能。
 */
export interface AIPort {
  /** 汎用チャット（プロンプト → テキスト応答） */
  chat(prompt: string, systemPrompt?: string): Promise<string>;
  /** 自然言語からブロック構成を生成 */
  generateBlocks(description: string): Promise<BlockGenerationResult>;
  /** 画像を解析してブロック配置データを生成 */
  analyzeImage(imageBase64: string): Promise<ImageAnalysisResult>;
  /** 現在のブロック配置から構造改善提案を生成 */
  suggestStructure(blocks: Block[]): Promise<StructureSuggestion[]>;
}
```

#### AI アダプター選択ロジック

```typescript
// packages/backend/src/adapters/ai-adapter-factory.ts
import { AIPort } from './ai-port';
import { BedrockAdapter } from './bedrock-adapter';
import { OllamaAdapter } from './ollama-adapter';
import { MockAIAdapter } from './mock-ai-adapter';

/**
 * 環境変数と Ollama の起動状態に応じて適切な AI アダプターを返す。
 *
 * - MOCK_AWS=false → BedrockAdapter（本番: Amazon Bedrock Claude）
 * - MOCK_AWS=true かつ Ollama 起動中 → OllamaAdapter（ローカル LLM）
 * - MOCK_AWS=true かつ Ollama 未起動 → MockAIAdapter（固定レスポンス）
 */
export async function createAIAdapter(): Promise<AIPort> {
  const isMock = process.env.MOCK_AWS === 'true';

  if (!isMock) {
    return new BedrockAdapter();
  }

  // Ollama の起動チェック
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (res.ok) {
      const model = process.env.OLLAMA_MODEL ?? 'qwen2.5';
      console.log(`[AI] OllamaAdapter selected (model: ${model})`);
      return new OllamaAdapter(model);
    }
  } catch {
    // Ollama 未起動
  }

  console.log('[AI] MockAIAdapter selected (fixed responses)');
  return new MockAIAdapter();
}
```

#### OllamaAdapter 概要

```typescript
// packages/backend/src/adapters/ollama-adapter.ts（概要）
export class OllamaAdapter implements AIPort {
  private readonly baseUrl = 'http://localhost:11434';
  constructor(private readonly model: string = 'qwen2.5') {}

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });
    const data = await res.json();
    return data.message.content;
  }

  // generateBlocks, analyzeImage, suggestStructure は
  // chat() を内部で呼び出し、JSON パース → 型変換で実装
}
```

#### Agent 専用エンドポイントと OpenAPI スキーマ

```typescript
// packages/backend/src/api/agent.ts（概要）
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const agentApp = new OpenAPIHono();

// 例: 数量算出エンドポイント
const quantityRoute = createRoute({
  method: 'post',
  path: '/quantity',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            blocks: z.array(BlockSchema).describe('数量算出対象のブロック配列。各ブロックには Qto_BaseQuantities PropertySet が必要'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: QuantityResultSchema } },
      description: '数量算出結果（要素タイプ別の体積・面積・長さ・個数）',
    },
  },
});

agentApp.openapi(quantityRoute, async (c) => {
  const { blocks } = c.req.valid('json');
  const result = simulationUsecase.calculateQuantity(blocks);
  return c.json(result);
});

// OpenAPI スキーマ出力
agentApp.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'IFC Lego BIM Simulator - Agent API', version: '1.0.0' },
});

export { agentApp };
```

### バックエンドアダプター構成

DB と同様に AI 連携も Port/Adapter パターンで抽象化する。環境変数 `MOCK_AWS` と Ollama の起動状態に応じてアダプターを自動選択する。

```
packages/backend/src/
├── adapters/
│   ├── db-port.ts                 # DB Port インターフェース（既存）
│   ├── mock-db-adapter.ts         # Mock DB アダプター（既存）
│   ├── dynamo-db-adapter.ts       # DynamoDB アダプター
│   ├── ai-port.ts                 # AI Port インターフェース
│   ├── bedrock-adapter.ts         # Bedrock アダプター（本番）
│   ├── ollama-adapter.ts          # Ollama アダプター（ローカル開発）
│   ├── mock-ai-adapter.ts         # Mock AI アダプター（テスト）
│   └── ai-adapter-factory.ts      # AI アダプターファクトリ（環境に応じた自動選択）
├── api/
│   ├── users.ts                   # 既存
│   ├── projects.ts                # プロジェクト CRUD
│   ├── simulation.ts              # シミュレーション
│   ├── schedule.ts                # 工程管理
│   ├── check.ts                   # 構造・法規チェック
│   ├── ai.ts                      # AI 連携（フロントエンド向け）
│   ├── ifc.ts                     # IFC 入出力
│   ├── dashboard.ts               # ダッシュボード
│   ├── compare.ts                 # プロジェクト比較
│   └── agent.ts                   # Agent 専用エンドポイント（@hono/zod-openapi）
├── usecases/
│   ├── user-usecase.ts            # 既存
│   ├── project-usecase.ts         # プロジェクト管理
│   ├── simulation-usecase.ts      # シミュレーション
│   ├── schedule-usecase.ts        # 工程管理
│   ├── ai-usecase.ts              # AI 連携
│   └── check-usecase.ts           # チェック
├── index.ts
└── dev.ts
```
