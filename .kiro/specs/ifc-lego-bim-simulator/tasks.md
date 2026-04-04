# 実装計画: IFC レゴ BIM シミュレーター

## 概要

本実装計画は、設計書の「実装フェーズ戦略」「並行開発ガイドライン」「マルチ AI ツール対応と Spec 分散開発方針」に従い、Phase 0〜4 の順で段階的に実装を進める。タスクはグループ（A〜F）単位で分割し、各グループのタスク詳細は個別ファイルに記載する。

実装言語: TypeScript（Hono / Vitest / React / Three.js）
ボイラープレート: basic-serverless-app（モノレポ構成）

## フェーズ構成

| フェーズ | 内容 | タスクファイル |
|----------|------|--------------|
| Phase 0 | インターフェース定義 + スタブ実装 | 本ファイル |
| Phase 1 | グループ A（コア機能）+ 3D エンジン基礎 | tasks/group-a.md |
| Phase 2 | グループ B（BIM シミュレーション）+ グループ C（工程管理） | tasks/group-b.md, tasks/group-c.md |
| Phase 3 | ブラッシュアップ + 品質向上 | 本ファイル（Phase 3 セクション） |
| Phase 4 | グループ D（AI）+ グループ E（建設チェック）+ グループ F（データ連携） | tasks/group-d.md, tasks/group-e.md, tasks/group-f.md |

## タスク

- [x] 1. Phase 0: shared パッケージの Zod スキーマ・型定義
  - [x] 1.1 ブロック関連スキーマの定義（block.ts）
    - `BlockSchema`, `Vector3Schema`, `DimensionsSchema`, `PropertySetSchema`, `BlockCategoryEnum`, `IfcElementTypeEnum` を定義
    - `packages/shared/src/models/block.ts` を作成
    - _要件: 1.1, 1.4, 2.1, 3.1_
  - [x] 1.2 工程情報スキーマの定義（schedule.ts）
    - `ScheduleInfoSchema`, `DependencySchema`, `DependencyTypeEnum`, `ProgressStatusEnum` を定義
    - `packages/shared/src/models/schedule.ts` を作成
    - _要件: 4.1, 4.2, 4.3_
  - [x] 1.3 プロジェクトスキーマの定義（project.ts）
    - `ProjectSchema`, `ProjectSummarySchema`, `ProjectMetadataSchema`, `ProjectStatusEnum` を定義
    - `packages/shared/src/models/project.ts` を作成
    - _要件: 13.1, 24.1_
  - [x] 1.4 シミュレーション結果スキーマの定義（simulation-result.ts）
    - `QuantityResultSchema`, `CostResultSchema`, `ClashResultSchema`, `CriticalPathResultSchema`, `StructureCheckResultSchema`, `RegulationCheckResultSchema` を定義
    - `packages/shared/src/models/simulation-result.ts` を作成
    - _要件: 8.1, 9.1, 10.1, 6.1, 18.1, 19.1_
  - [x] 1.5 AI 連携結果スキーマの定義（ai-result.ts）
    - `BlockGenerationResultSchema`, `ImageAnalysisResultSchema`, `StructureSuggestionSchema` を定義
    - `packages/shared/src/models/ai-result.ts` を作成
    - _要件: 15.1, 16.1, 17.1_
  - [x] 1.6 shared の index.ts を更新し全スキーマ・型をエクスポート
    - `packages/shared/src/index.ts` に全モデルの re-export を追加
    - _要件: 全要件共通_

- [x] 2. Phase 0: shared パッケージのエンジンインターフェース・スタブ実装
  - [x] 2.1 数量算出エンジンのインターフェースと Level 0 スタブ
    - `packages/shared/src/engines/quantity-engine.ts` を作成
    - 入力: `Block[]` → 出力: `QuantityResult`。Level 0 は固定値 `{ count: 0 }` を返す
    - _要件: 8.1, 8.2_
  - [x] 2.2 コスト概算エンジンのインターフェースと Level 0 スタブ
    - `packages/shared/src/engines/cost-engine.ts` を作成
    - 入力: `Block[]` → 出力: `CostResult`。Level 0 は固定値 `{ total: 0 }` を返す
    - _要件: 9.1, 9.2_
  - [x] 2.3 干渉チェックエンジンのインターフェースと Level 0 スタブ
    - `packages/shared/src/engines/clash-engine.ts` を作成
    - 入力: `Block[]` → 出力: `ClashResult`。Level 0 は固定値 `{ clashes: [] }` を返す
    - _要件: 10.1, 10.2_
  - [x] 2.4 工程管理エンジンのインターフェースと Level 0 スタブ
    - `packages/shared/src/engines/schedule-engine.ts` を作成
    - ガントチャートデータ生成・クリティカルパス分析の関数シグネチャを定義。Level 0 は固定データを返す
    - _要件: 5.1, 6.1_
  - [x] 2.5 構造チェック・法規チェック・環境・安全管理エンジンのインターフェースと Level 0 スタブ
    - `packages/shared/src/engines/structure-check-engine.ts`, `regulation-check-engine.ts`, `environment-engine.ts`, `safety-engine.ts` を作成
    - 各エンジンの関数シグネチャを定義。Level 0 は固定値を返す
    - _要件: 18.1, 19.1, 20.1, 21.1_
  - [x] 2.6 IFC パーサー・シリアライザーのインターフェースと Level 0 スタブ
    - `packages/shared/src/ifc/ifc-parser.ts`, `ifc-serializer.ts`, `ifc-types.ts` を作成
    - パース・シリアライズの関数シグネチャを定義。Level 0 は固定値を返す
    - _要件: 11.1, 12.1_
  - [x] 2.7 JSON シリアライザー・デシリアライザーのインターフェースと Level 0 スタブ
    - `packages/shared/src/serialization/project-serializer.ts`, `project-deserializer.ts` を作成
    - _要件: 14.1, 14.2_

- [x] 3. Phase 0: backend の Port/Adapter・API ルートスタブ
  - [x] 3.1 DbPort インターフェースの拡張
    - 既存の `DbPort` にプロジェクト CRUD メソッドを追加（`getProject`, `createProject`, `updateProject`, `deleteProject`, `listProjects`, `duplicateProject`）
    - `packages/backend/src/adapters/db-port.ts` を更新
    - _要件: 13.1, 24.1, 24.3, 24.4, 24.5_
  - [x] 3.2 MockDbAdapter の拡張
    - DbPort の新メソッドをインメモリ Map で実装（Level 1 ステートフル）
    - `packages/backend/src/adapters/mock-db-adapter.ts` を更新
    - _要件: 13.1, 24.1_
  - [x] 3.3 AIPort インターフェースの定義
    - `chat`, `generateBlocks`, `analyzeImage`, `suggestStructure` メソッドを定義
    - `packages/backend/src/adapters/ai-port.ts` を作成
    - _要件: 15.1, 16.1, 17.1_
  - [x] 3.4 MockAIAdapter の実装（Level 0 固定レスポンス）
    - AIPort の全メソッドに固定レスポンスを返す実装
    - `packages/backend/src/adapters/mock-ai-adapter.ts` を作成
    - _要件: 15.1, 16.1, 17.1_
  - [x] 3.5 AI アダプターファクトリの実装
    - 環境変数に応じた AI アダプター選択ロジック
    - `packages/backend/src/adapters/ai-adapter-factory.ts` を作成
    - _要件: 15.1_
  - [x] 3.6 全 Usecase クラスのスタブ実装
    - `ProjectUsecase`, `SimulationUsecase`, `ScheduleUsecase`, `AIUsecase`, `CheckUsecase` を作成
    - 各メソッドは shared エンジンのスタブを呼び出す
    - `packages/backend/src/usecases/` 配下に作成
    - _要件: 全要件共通_
  - [x] 3.7 全 API ルートのスタブ実装
    - `projectsApp`, `simulationApp`, `scheduleApp`, `checkApp`, `aiApp`, `ifcApp`, `dashboardApp`, `compareApp` を作成
    - 各ルートは Usecase のスタブメソッドを呼び出し、スタブレスポンス（`_stub: true`）を返す
    - `packages/backend/src/api/` 配下に作成
    - _要件: 全要件共通_
  - [x] 3.8 Agent 専用エンドポイントのスタブ実装
    - `@hono/zod-openapi` を使用した `agentApp` を作成
    - 全 Agent エンドポイント（quantity, cost, clash, structure-check, regulation-check, suggest-structure, generate-blocks, project, projects）のスタブ
    - OpenAPI スキーマ出力エンドポイント（`/openapi.json`）
    - `packages/backend/src/api/agent.ts` を作成
    - _要件: 設計書 Agent 専用エンドポイント_
  - [x] 3.9 index.ts の更新（全ルートのマウント）
    - `packages/backend/src/index.ts` に全サブルーターをマウント
    - _要件: 全要件共通_

- [x] 4. Phase 0: API 契約テスト + Phase 0 結合テスト
  - [x] 4.1 プロジェクト API 契約テスト
    - `POST /api/projects`, `GET /api/projects`, `GET /api/projects/:id`, `PUT /api/projects/:id`, `DELETE /api/projects/:id` の Zod スキーマ準拠テスト
    - `packages/backend/test/projects.test.ts` を作成
    - _要件: 13.1, 24.1_
  - [x] 4.2 シミュレーション・工程管理・チェック・AI・IFC・ダッシュボード・比較 API 契約テスト
    - 全エンドポイントのレスポンスが対応する Zod スキーマに準拠することを検証
    - `packages/backend/test/` 配下に各テストファイルを作成
    - _要件: 8.1, 9.1, 10.1, 5.1, 6.1, 18.1, 19.1, 15.1, 16.1, 11.1, 12.1, 22.1, 23.1_
  - [x] 4.3 Agent 専用エンドポイント契約テスト + OpenAPI スキーマ出力テスト
    - Agent 全エンドポイントの Zod スキーマ準拠テスト
    - `/api/agent/openapi.json` が有効な OpenAPI 3.0 スキーマを返すことを検証
    - `packages/backend/test/agent.test.ts` を作成
    - _要件: 設計書 Agent 専用エンドポイント_
  - [x] 4.4 MockDbAdapter CRUD フローテスト
    - 作成 → 取得 → 更新 → 削除のフルフローをテスト
    - `packages/backend/test/adapters/mock-db-adapter.test.ts` を作成
    - _要件: 13.1, 24.3, 24.4_

- [x] 5. Phase 0 チェックポイント
  - `npm run build` が全パッケージで通ること、`npm run test` が全パッケージで通ること、`npm run dev:mock` で全エンドポイントがスタブレスポンスを返すことを確認
  - 問題があればユーザーに確認

- [ ] 6. Phase 1: グループ A（コア機能）+ 3D エンジン基礎
  - 詳細は `tasks/group-a.md` を参照
  - ブロックパレット、3D キャンバス、属性パネル、プロジェクト CRUD、JSON シリアライズ、プロジェクト一覧
  - _要件: 1, 2, 3, 13, 14, 24_
  - サブタスク進捗（`tasks/group-a.md` と同期）:
    - [ ] A1. プロジェクト CRUD API
    - [ ] A2. JSON シリアライズ／デシリアライズ
    - [ ] A3. ブロックパレット
    - [x] A4. 3D キャンバス基礎（A4.1〜A4.5）
    - [ ] A5. 属性パネル
    - [ ] A6. プロジェクト一覧
    - [ ] A7. ページルーティングとレイアウト統合
    - [ ] A8. Phase 1 結合テスト

- [ ] 7. Phase 1 チェックポイント
  - グループ A の全エンドポイントが `_stub: false` を返すこと、全テストが通ることを確認
  - 問題があればユーザーに確認

- [ ] 8. Phase 2: グループ B（BIM シミュレーション）
  - 詳細は `tasks/group-b.md` を参照
  - 数量算出、コスト概算、干渉チェック
  - _要件: 8, 9, 10_

- [ ] 9. Phase 2: グループ C（工程管理）
  - 詳細は `tasks/group-c.md` を参照
  - 工程情報、ガントチャート、クリティカルパス
  - _要件: 4, 5, 6_

- [ ] 10. Phase 2 チェックポイント
  - グループ A, B, C の全エンドポイントが `_stub: false` を返すこと、全テストが通ることを確認
  - 問題があればユーザーに確認

- [ ] 11. Phase 3: ブラッシュアップ + 品質向上
  - [ ] 11.1 パフォーマンス最適化
    - 100 ブロック以上での数量算出、干渉チェック、ガントチャートのパフォーマンステスト
    - ボトルネックの特定と最適化
    - _要件: 8.1, 10.1, 5.1_
  - [ ] 11.2 エッジケース・エラーハンドリング強化
    - 無効入力、空プロジェクト、ブロック不足、循環依存等のエラーケース網羅テスト
    - _要件: 3.4, 4.4, 4.5, 10.4, 5.5, 6.5_
  - [ ] 11.3 4D シミュレーション（工程アニメーション）の実装
    - 工程情報の開始日順にブロックを順次表示するアニメーション
    - 再生、一時停止、停止、再生速度調整コントロール
    - タイムラインバーとガントチャート上のカーソル表示
    - 進捗状態に応じた色分け表示
    - `packages/frontend/src/components/canvas/SimulationOverlay.tsx` を実装
    - _要件: 7.1, 7.2, 7.3, 7.4_
  - [ ] 11.4 フロントエンド UX 磨き込み
    - スナップ機能の精度向上、操作ハンドルの改善、レスポンシブ対応
    - _要件: 2.3, 2.4_
  - [ ]* 11.5 プロパティベーステストの拡充
    - 全 Property のイテレーション数を 100 → 500 に増加
    - _要件: 全要件共通_

- [ ] 12. Phase 3 チェックポイント
  - 100 ブロックでの操作がストレスなく動作すること、全エラーケースで適切なメッセージが返ることを確認
  - 問題があればユーザーに確認

- [ ] 13. Phase 4: グループ D（AI 活用）
  - 詳細は `tasks/group-d.md` を参照
  - AI 構造提案、自然言語モデリング、画像認識
  - _要件: 15, 16, 17_

- [ ] 14. Phase 4: グループ E（建設チェック）
  - 詳細は `tasks/group-e.md` を参照
  - 構造チェック、法規チェック、環境シミュレーション、安全管理
  - _要件: 18, 19, 20, 21_

- [ ] 15. Phase 4: グループ F（データ連携）
  - 詳細は `tasks/group-f.md` を参照
  - ダッシュボード、IFC 入出力、プロジェクト比較
  - _要件: 22, 11, 12, 23_

- [ ] 16. Phase 4 チェックポイント（最終）
  - 全グループ（A〜F）の全エンドポイントが `_stub: false` を返すこと、全 26 Property のテストが通ること、Agent API が OpenAPI スキーマと整合することを確認
  - 問題があればユーザーに確認

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- 各タスクは要件番号を参照し、トレーサビリティを確保
- チェックポイントで段階的に品質を検証
- グループ別タスクファイルにより、並行開発時のコンフリクトを回避
