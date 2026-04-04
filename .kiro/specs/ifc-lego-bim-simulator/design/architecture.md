# 技術設計書: IFC レゴ BIM シミュレーター — アーキテクチャ

## アーキテクチャ

### システム全体構成

```mermaid
graph TB
    subgraph Frontend["packages/frontend (React + Three.js)"]
        UI[Cloudscape UI]
        Canvas3D[3D キャンバス<br/>Three.js / React Three Fiber]
        GanttUI[ガントチャート UI]
        DashboardUI[ダッシュボード UI]
    end

    subgraph ExternalAgent["外部 AI エージェント"]
        MCPClient[MCP Client / Bedrock Agent]
    end

    subgraph Backend["packages/backend (Hono)"]
        API[Hono API Routes<br/>フロントエンド向け]
        AgentAPI[Agent API Routes<br/>/api/agent/* フラットJSON]
        OpenAPIDoc[OpenAPI スキーマ<br/>@hono/zod-openapi]
        subgraph Usecases["ユースケース層"]
            ProjectUC[ProjectUsecase]
            SimulationUC[SimulationUsecase]
            ScheduleUC[ScheduleUsecase]
            AIUC[AIUsecase]
            CheckUC[CheckUsecase]
        end
        subgraph Adapters["アダプター層"]
            DBAdapter[DB Adapter]
            subgraph AIPortGroup["AIPort (インターフェース)"]
                BedrockAdapter[BedrockAdapter<br/>本番: Bedrock Claude]
                OllamaAdapter[OllamaAdapter<br/>ローカル: Ollama]
                MockAIAdapter[MockAIAdapter<br/>テスト: 固定レスポンス]
            end
            IFCAdapter[IFC Adapter]
        end
    end

    subgraph Shared["packages/shared"]
        Models[データモデル / Zod スキーマ]
        SimEngine[シミュレーションエンジン]
        ScheduleEngine[工程管理エンジン]
        IFCParser[IFC パーサー]
        IFCSerializer[IFC シリアライザー]
    end

    Frontend -->|Hono RPC| API
    MCPClient -->|フラットJSON| AgentAPI
    AgentAPI --> OpenAPIDoc
    API --> Usecases
    AgentAPI --> Usecases
    Backend --> Shared
    Frontend --> Shared
    DBAdapter -->|DynamoDB / Mock| DB[(データストア)]
    BedrockAdapter -->|Bedrock API| AI[Amazon Bedrock]
    OllamaAdapter -->|HTTP localhost:11434| Ollama[Ollama ローカル LLM]
```

### 完全オフライン構成（Mock モード）

`MOCK_AWS=true` 環境では、以下の構成により AWS 接続なしで AI エージェント連携を含む全機能が動作する。

```mermaid
graph LR
    LLM[ローカル LLM<br/>Ollama Qwen/Llama] -->|MCP / Function Calling| AgentAPI2["/api/agent/*<br/>Hono localhost:3001"]
    AgentAPI2 --> UC[Usecase層]
    UC --> Engines[shared engines<br/>計算ロジック]
    UC --> MockDB[MockDbAdapter<br/>インメモリ]
    UC --> AIPort2{AIPort}
    AIPort2 -->|Ollama 起動時| OllamaAd[OllamaAdapter]
    AIPort2 -->|Ollama 未起動時| MockAI[MockAIAdapter<br/>固定レスポンス]
```

### アーキテクチャ上の決定事項

| 決定事項 | 選択 | 理由 |
|----------|------|------|
| 3D レンダリング | Three.js + React Three Fiber | React エコシステムとの統合が容易。宣言的な 3D シーン記述が可能。BIM 用途に十分な性能 |
| IFC パース/シリアライズ | web-ifc (IFC.js) | WebAssembly ベースの高速 IFC パーサー。ブラウザ・Node.js 両対応。IFC2x3/IFC4 サポート |
| ガントチャート | カスタム実装 (SVG/Canvas) | Cloudscape Design System との統合を優先。軽量で依存を最小化 |
| 状態管理 | Zustand | 軽量で TypeScript 親和性が高い。3D シーンの状態管理に適する |
| バリデーション | Zod（既存踏襲） | 既存ボイラープレートとの一貫性。ランタイムバリデーションと型推論の両立 |
| AI 連携 | AIPort + 3 アダプター（BedrockAdapter / OllamaAdapter / MockAIAdapter） | Port/Adapter パターンで抽象化。本番は Bedrock Claude、ローカル開発は Ollama（Qwen/Llama 等）、テストは固定レスポンス Mock。環境変数 `MOCK_AWS` と Ollama 起動状態で自動切替 |
| Agent 専用 API | `/api/agent/*` フラット JSON エンドポイント | フロントエンド用 API とは別に、AI エージェントが呼びやすいシンプルな I/F を提供。既存 Usecase を再利用（DRY） |
| OpenAPI スキーマ自動出力 | `@hono/zod-openapi` | Zod スキーマに `.describe()` を付与し、Bedrock Agent Action Group / MCP ツール定義に直接利用可能な OpenAPI JSON を自動生成 |
| グラフ描画 | Recharts | React ベース。Cloudscape との統合が容易。ダッシュボードのグラフ表示に使用 |
