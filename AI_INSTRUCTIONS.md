# AI Architect Instructions: Block BIM Studio

This repository is a monorepo for a BIM (Building Information Modeling) simulation web application.
Any AI coding assistant generating code or configurations for this repository MUST adhere strictly to the rules below.

## Spec ドキュメント

本プロジェクトの要件・設計・タスクは以下のファイルで管理されています。全部読む必要はありません。担当する作業に必要なファイルだけを参照してください。

- 要件: `.kiro/specs/ifc-lego-bim-simulator/requirements.md`
- 設計（概要+リンク集）: `.kiro/specs/ifc-lego-bim-simulator/design.md`
- 設計（分割）: `.kiro/specs/ifc-lego-bim-simulator/design/` 配下
  - `architecture.md` — アーキテクチャ・決定事項
  - `api.md` — API エンドポイント・Agent API・AIPort
  - `frontend.md` — フロントエンド構成・Shared パッケージ
  - `data-models.md` — Zod スキーマ・データモデル・ER図
  - `properties.md` — 正確性プロパティ 26件
  - `devops.md` — フェーズ戦略・並行開発・バージョニング・マルチAIツール
  - `testing.md` — テスト戦略・結合テスト計画
- タスク（メイン）: `.kiro/specs/ifc-lego-bim-simulator/tasks.md`
- タスク（グループ別）: `.kiro/specs/ifc-lego-bim-simulator/tasks/group-{a..f}.md`
- 設計経緯: `.kiro/specs/ifc-lego-bim-simulator/design-evolution.md`

実装前に必ず該当するタスクファイルと設計書を参照してください。

## 1. Architecture: Ports and Adapters (Hexagonal Architecture)
* **Backend (`packages/backend`)**: MUST separate business logic from infrastructure using interfaces. All AWS-specific logic (DynamoDB, Cognito, etc.) MUST be abstracted behind an adapter interface.
* **AI Adapters**: AI integration MUST be abstracted behind `AIPort` interface with three adapters: `BedrockAdapter` (production), `OllamaAdapter` (local dev), `MockAIAdapter` (test).
* **Testing / Mocking**: The project MUST support running completely offline with mock implementations via `MOCK_AWS=true`.
* **Frameworks**: Backend routing MUST rely on `hono`.

## 2. Shared Resources
* **`packages/shared`**: ALL Domain models, API request/response types, Zod schemas, and calculation engines MUST be defined in `packages/shared`.
* Both Frontend and Backend MUST import types and schemas directly from `packages/shared`. Do NOT duplicate types.
* Calculation engines (quantity, cost, clash, schedule, structure-check, regulation-check, environment, safety) are in `packages/shared/src/engines/`.

## 3. Workspaces and Dependencies
* Built on `npm workspaces`.
* Do NOT install dependencies globally; install them in the respective workspaces.

## 4. Technology Stack
* **Frontend**: React + Vite + Three.js (React Three Fiber) + Cloudscape Design System + Zustand
* **Backend**: Hono + TypeScript
* **3D**: Three.js + React Three Fiber
* **IFC**: web-ifc (WebAssembly)
* **Validation**: Zod
* **Testing**: Vitest + fast-check (Property-Based Testing)
* **AI**: Amazon Bedrock (production) / Ollama (local dev)
* **Infrastructure**: AWS CDK

## 5. API Design
* **Frontend API**: Hono RPC client at `packages/frontend/src/api/client.ts`. Avoid manual `fetch` calls.
* **Agent API**: Flat JSON endpoints at `/api/agent/v1/*` using `@hono/zod-openapi`. Use `.describe()` on Zod schemas for AI agent instructions.
* **Stub Flag**: All API responses include `_stub` and `_stubLevel` fields to indicate stub vs real implementation.

## 6. Routing & API Client
* When adding a new domain/feature, create a sub-router in `packages/backend/src/api/<domain>.ts`.
* Mount it in `packages/backend/src/index.ts` using `app.route()`.
* Frontend MUST use Hono RPC client exclusively.

## 7. Testing & Quality Assurance
* **API Contract Tests (highest priority)**: Validate Zod schema compliance for all endpoints using `app.request()`.
* **Engine Unit Tests**: Test calculation logic in `packages/shared`.
* **Property-Based Tests**: Use fast-check. Tag with `Feature: ifc-lego-bim-simulator, Property {N}: {text}`.
* **Backend**: Vitest with `app.request()` against MockDbAdapter.
* **Frontend**: Vitest + @testing-library/react.

## 8. Stub Levels
* **Level 0**: Fixed values (Phase 0 initial)
* **Level 1**: Stateful/simple calculation stubs (frontend dev unblocked)
* **Level 2**: Real implementation (V1 ready)

## 9. V0 → V1 Promotion
* Promote by functional group (A-F), not individual endpoints.
* All endpoints in a group must be Level 2 before V1 promotion.
* Different groups can be at different versions independently.

## 10. Distributed Development
* Task files are split by group (`tasks/group-*.md`) to avoid conflicts.
* Use `[-] Task @assignee` format when starting a task.
* Pull latest before starting any task.

**If you, the AI, are updating this project, do not propose architectural changes that violate these rules without explicit user approval.**
