# 実装タスク: グループ A（コア機能）+ 3D エンジン基礎

## 概要

Phase 1 で実装するグループ A のタスク詳細。ブロックパレット、3D キャンバス、属性パネル、プロジェクト CRUD、JSON シリアライズ、プロジェクト一覧を含む。

## タスク

- [ ] A1. プロジェクト CRUD API の本実装（Level 2）
  - [ ] A1.1 API 契約テストの確認・拡充
    - Phase 0 で作成した `projects.test.ts` の契約テストが通ることを確認
    - CRUD フロー（作成 → 取得 → 更新 → 削除）の統合テストを追加
    - `packages/backend/test/projects.test.ts` を更新
    - _要件: 13.1, 13.2, 13.3, 13.4, 24.1, 24.2, 24.3, 24.4, 24.5_
  - [ ] A1.2 ProjectUsecase の本実装
    - `createProject`, `getProject`, `updateProject`, `deleteProject`, `listProjects`, `duplicateProject`, `archiveProject` を実装
    - DbPort 経由でデータストアにアクセス
    - `packages/backend/src/usecases/project-usecase.ts` を更新
    - _要件: 13.1, 24.1, 24.3, 24.4, 24.5_
  - [ ] A1.3 プロジェクト API ルートの本実装
    - スタブレスポンスを本実装に置き換え、`_stub: false` を返す
    - Zod バリデーション、エラーハンドリング（404, 400）を実装
    - `packages/backend/src/api/projects.ts` を更新
    - _要件: 13.1, 13.4, 24.1_
  - [ ]* A1.4 プロジェクト CRUD のプロパティテスト
    - **Property 22: プロジェクト複製の等価性**
    - **検証対象: 要件 24.3**

- [ ] A2. JSON シリアライズ/デシリアライズの本実装（Level 2）
  - [ ] A2.1 API 契約テストの確認
    - シリアライズ → デシリアライズのラウンドトリップテストを作成
    - `packages/shared/test/serialization/project-serializer.test.ts` を作成
    - _要件: 14.1, 14.2, 14.3_
  - [ ] A2.2 プロジェクト JSON シリアライザーの本実装
    - `ProjectSchema` に準拠した JSON シリアライズ/デシリアライズを実装
    - `packages/shared/src/serialization/project-serializer.ts` を更新
    - `packages/shared/src/serialization/project-deserializer.ts` を更新
    - _要件: 14.1, 14.2_
  - [ ]* A2.3 JSON ラウンドトリップのプロパティテスト
    - **Property 1: プロジェクトデータ JSON ラウンドトリップ**
    - fast-check で任意の有効なプロジェクトデータを生成し、シリアライズ → デシリアライズの等価性を検証
    - `packages/shared/test/serialization/project-serializer.prop.test.ts` を作成
    - **検証対象: 要件 14.1, 14.2, 14.3**

- [ ] A3. フロントエンド: ブロックパレットの実装
  - [ ] A3.1 ブロックカタログデータの定義
    - 標準ブロック（壁、柱、梁、スラブ、窓、ドア、配管、ダクト）のカタログデータを定義
    - カテゴリ（structure, opening, equipment）ごとの分類
    - `packages/frontend/src/data/block-catalog.ts` を作成
    - _要件: 1.1, 1.4_
  - [ ] A3.2 BlockPalette コンポーネントの実装
    - カテゴリタブ、ブロック一覧（アイコン + 名称）、検索フィールドを実装
    - Cloudscape Design System のコンポーネントを使用
    - `packages/frontend/src/components/palette/BlockPalette.tsx` を作成
    - _要件: 1.1, 1.2, 1.3, 1.4_
  - [ ]* A3.3 ブロックパレット検索のプロパティテスト
    - **Property 3: ブロックパレット検索フィルタリング**
    - **検証対象: 要件 1.3**

- [ ] A4. フロントエンド: 3D キャンバスの基礎実装
  - [ ] A4.1 Zustand ストアの実装
    - `projectStore`（プロジェクト状態）、`canvasStore`（選択、カメラ）を実装
    - `packages/frontend/src/stores/projectStore.ts`, `canvasStore.ts` を作成
    - _要件: 2.1, 13.3_
  - [ ] A4.2 Canvas3D コンポーネントの実装（React Three Fiber）
    - Three.js シーン、カメラ、ライティング、グリッドの基本セットアップ
    - ズームイン/ズームアウト、オービット操作
    - `packages/frontend/src/components/canvas/Canvas3D.tsx` を作成
    - _要件: 2.5, 2.6_
  - [ ] A4.3 Block3D コンポーネントの実装
    - ブロックの 3D メッシュ表現（IFC 要素タイプに応じた形状・色）
    - 選択状態のハイライト表示
    - `packages/frontend/src/components/canvas/Block3D.tsx` を作成
    - _要件: 2.1, 2.2_
  - [ ] A4.4 ドラッグ＆ドロップの実装
    - ブロックパレットからキャンバスへのドラッグ＆ドロップ
    - キャンバス上でのブロック移動・回転・削除の操作ハンドル
    - `packages/frontend/src/hooks/useDragDrop.ts` を作成
    - `packages/frontend/src/components/canvas/SelectionHandler.tsx` を作成
    - _要件: 2.1, 2.2_
  - [ ] A4.5 スナップ機能の実装
    - グリッドスナップ、エッジスナップのガイドライン表示
    - 10mm 以内の距離でブロック同士を自動吸着
    - `packages/frontend/src/hooks/useSnap.ts` を作成
    - `packages/frontend/src/components/canvas/SnapGuide.tsx` を作成
    - _要件: 2.3, 2.4_
  - [ ]* A4.6 スナップ距離判定のプロパティテスト
    - **Property 6: スナップ距離判定**
    - **検証対象: 要件 2.4**

- [ ] A5. フロントエンド: 属性パネルの実装
  - [ ] A5.1 PropertyPanel コンポーネントの実装
    - 選択ブロックの要素タイプ、名称、寸法、全 PropertySet の表示・編集
    - デフォルト PropertySet（Pset_Common, Qto_BaseQuantities, Pset_Cost）の提供
    - カスタム PropertySet 追加フォーム
    - Cloudscape FormField を使用したバリデーションエラー表示
    - `packages/frontend/src/components/properties/PropertyPanel.tsx` を作成
    - _要件: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* A5.2 数値属性バリデーションのプロパティテスト
    - **Property 7: 数値属性バリデーション**
    - **検証対象: 要件 3.4**

- [ ] A6. フロントエンド: プロジェクト一覧画面の実装
  - [ ] A6.1 ProjectList / ProjectCard コンポーネントの実装
    - サムネイル、プロジェクト名、ステータス、更新日時、ブロック数、コスト概算合計のカード表示
    - 新規作成、複製、削除（確認ダイアログ付き）、アーカイブ操作
    - 検索フィールド、ソート機能（ステータス、更新日時、ブロック数、コスト概算合計）
    - Hono RPC クライアント経由でバックエンド API を呼び出し
    - `packages/frontend/src/components/project/ProjectList.tsx`, `ProjectCard.tsx` を作成
    - `packages/frontend/src/pages/ProjectListPage.tsx` を作成
    - _要件: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_
  - [ ]* A6.2 プロジェクト一覧検索・ソートのプロパティテスト
    - **Property 4: プロジェクト一覧検索フィルタリング**
    - **Property 5: プロジェクト一覧ソート**
    - **検証対象: 要件 24.6, 24.7**

- [ ] A7. フロントエンド: ページルーティングとレイアウト統合
  - [ ] A7.1 ページルーティングの設定
    - ProjectListPage、EditorPage、DashboardPage のルーティング設定
    - EditorPage にブロックパレット、3D キャンバス、属性パネルを統合
    - `packages/frontend/src/pages/EditorPage.tsx` を作成
    - _要件: 1.1, 2.1, 3.1, 13.3_
  - [ ] A7.2 Agent 専用エンドポイント（project 系）の本実装
    - `/api/agent/project/:id`, `/api/agent/projects` のスタブを本実装に置き換え
    - `packages/backend/src/api/agent.ts` を更新
    - _要件: 設計書 Agent 専用エンドポイント_

- [ ] A8. Phase 1 結合テスト
  - [ ] A8.1 コア機能の結合テスト
    - プロジェクト作成 → ブロック追加 → 属性編集 → 保存 → 再読み込みのフルフロー
    - プロジェクト一覧の検索・ソート・フィルタリング
    - プロジェクト複製・削除・アーカイブ
    - JSON シリアライズ/デシリアライズのラウンドトリップ
    - `packages/backend/test/integration/phase1.test.ts` を作成
    - _要件: 1, 2, 3, 13, 14, 24_
  - [ ]* A8.2 フロントエンドコンポーネントテスト
    - BlockPalette、PropertyPanel、ProjectList のコンポーネントテスト
    - `packages/frontend/test/components/` 配下にテストファイルを作成
    - _要件: 1, 3, 24_

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- 各タスクは Phase 0 で作成したスタブを本実装に置き換える形で進める
- 3D キャンバス（A4）は最も工数が大きいが、他のタスクとは独立して開発可能
