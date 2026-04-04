# 実装タスク: グループ D（AI 活用）

## 概要

Phase 4 で実装するグループ D のタスク詳細。AI 構造提案、自然言語モデリング、画像認識の各機能の本実装を含む。

## タスク

- [ ] D1. AI アダプターの本実装
  - [ ] D1.1 API 契約テストの確認・拡充
    - `POST /api/ai/suggest-structure`, `POST /api/ai/generate-from-text`, `POST /api/ai/generate-from-image` の契約テストが通ることを確認
    - `packages/backend/test/ai.test.ts` を更新
    - _要件: 15.1, 16.1, 17.1_
  - [ ] D1.2 OllamaAdapter の本実装
    - `chat`, `generateBlocks`, `analyzeImage`, `suggestStructure` を Ollama API 経由で実装
    - JSON パース → 型変換のロジック
    - `packages/backend/src/adapters/ollama-adapter.ts` を作成
    - _要件: 15.1, 16.1, 17.1_
  - [ ] D1.3 BedrockAdapter の本実装
    - AWS Bedrock Claude API 経由での実装
    - `packages/backend/src/adapters/bedrock-adapter.ts` を作成
    - _要件: 15.1, 16.1, 17.1_
  - [ ]* D1.4 AI アダプターファクトリのテスト
    - 環境変数に応じた正しいアダプター選択の検証
    - `packages/backend/test/adapters/ai-adapter-factory.test.ts` を作成
    - _要件: 15.1_

- [ ] D2. AI 構造提案の本実装
  - [ ] D2.1 AIUsecase の構造提案メソッド本実装
    - ブロック配置を分析し、AIPort 経由で構造改善提案を生成
    - 3 個未満のブロックの場合のメッセージ返却
    - `packages/backend/src/usecases/ai-usecase.ts` を更新
    - _要件: 15.1, 15.2, 15.6_
  - [ ] D2.2 AI API ルート（構造提案）の本実装
    - `POST /api/ai/suggest-structure` のスタブを本実装に置き換え
    - `packages/backend/src/api/ai.ts` を更新
    - _要件: 15.1_
  - [ ] D2.3 フロントエンド: AI 構造提案パネルの実装
    - 提案リスト表示（提案内容、理由、優先度）
    - 提案選択時の半透明プレビュー表示
    - 「適用」「却下」ボタン
    - _要件: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] D3. 自然言語モデリングの本実装
  - [ ] D3.1 AIUsecase の自然言語モデリングメソッド本実装
    - テキスト入力を AIPort 経由で LLM に送信し、ブロック構成データを生成
    - 入力テキスト 1000 文字制限のバリデーション
    - 無効なレスポンスのエラーハンドリング
    - `packages/backend/src/usecases/ai-usecase.ts` を更新
    - _要件: 16.1, 16.5, 16.6_
  - [ ] D3.2 AI API ルート（自然言語モデリング）の本実装
    - `POST /api/ai/generate-from-text` のスタブを本実装に置き換え
    - `packages/backend/src/api/ai.ts` を更新
    - _要件: 16.1_
  - [ ] D3.3 フロントエンド: 自然言語入力 UI の実装
    - テキスト入力フィールド（1000 文字制限表示）
    - 生成ボタン、プレビュー表示、「確定」「再生成」ボタン
    - _要件: 16.1, 16.2, 16.3, 16.4, 16.6_
  - [ ]* D3.4 自然言語入力バリデーションのプロパティテスト
    - **Property 25: 自然言語入力文字数制限**
    - **検証対象: 要件 16.6**

- [ ] D4. 画像認識によるブロック生成の本実装
  - [ ] D4.1 AIUsecase の画像認識メソッド本実装
    - 画像ファイルを AIPort 経由で解析し、ブロック配置データを生成
    - ファイル形式（PNG, JPEG, PDF）・サイズ（10MB）バリデーション
    - 要素検出不可時のメッセージ返却
    - `packages/backend/src/usecases/ai-usecase.ts` を更新
    - _要件: 17.1, 17.5, 17.6_
  - [ ] D4.2 AI API ルート（画像認識）の本実装
    - `POST /api/ai/generate-from-image` のスタブを本実装に置き換え
    - `packages/backend/src/api/ai.ts` を更新
    - _要件: 17.1_
  - [ ] D4.3 フロントエンド: 画像アップロード UI の実装
    - ファイルアップロード（PNG, JPEG, PDF、最大 10MB）
    - 検出結果のプレビュー表示（信頼度スコア付き）
    - 「確定」ボタン、個別ブロック「除外」ボタン
    - _要件: 17.1, 17.2, 17.3, 17.4, 17.5_
  - [ ]* D4.4 ファイルアップロードバリデーションのプロパティテスト
    - **Property 26: ファイルアップロードバリデーション**
    - **検証対象: 要件 17.5**

- [ ] D5. Agent 専用エンドポイント（AI 系）の本実装
  - [ ] D5.1 Agent AI エンドポイントの本実装
    - `/api/agent/suggest-structure`, `/api/agent/generate-blocks` のスタブを本実装に置き換え
    - `packages/backend/src/api/agent.ts` を更新
    - _要件: 設計書 Agent 専用エンドポイント_

- [ ] D6. Phase 4 グループ D 結合テスト
  - [ ] D6.1 AI 連携結合テスト
    - ブロック配置 → AI 構造提案 → プレビュー → 適用のフルフロー
    - テキスト入力 → ブロック生成のフルフロー
    - MockAIAdapter を使用したテスト
    - `packages/backend/test/integration/phase4-group-d.test.ts` を作成
    - _要件: 15, 16, 17_

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- AI 機能は MockAIAdapter があるため、Bedrock/Ollama の実装を待たずにフロントエンド開発が可能
- OllamaAdapter はローカル開発用、BedrockAdapter は本番用
