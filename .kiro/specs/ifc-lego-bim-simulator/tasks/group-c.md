# 実装タスク: グループ C（工程管理）

## 概要

Phase 2 で実装するグループ C のタスク詳細。工程情報設定、ガントチャート、クリティカルパス分析の各機能の本実装と、対応するバックエンド API・フロントエンド UI を含む。

## タスク

- [ ] C1. 工程管理エンジンの本実装（Level 2）
  - [ ] C1.1 API 契約テストの確認・拡充
    - `POST /api/schedule/gantt`, `POST /api/schedule/critical-path` の契約テストが通ることを確認
    - 正常系・異常系（工程情報なし、依存関係 2 個未満）のテストケースを追加
    - `packages/backend/test/schedule.test.ts` を更新
    - _要件: 5.1, 5.5, 6.1, 6.5_
  - [ ] C1.2 ガントチャートデータ生成の本実装
    - 全ブロックの工程情報を集約し、ガントチャート用データ構造を生成
    - 開始日、終了日、工期のバーデータと依存関係の矢印データ
    - `packages/shared/src/engines/schedule-engine.ts` を Level 2 に更新
    - _要件: 5.1, 5.2_
  - [ ] C1.3 クリティカルパス分析（CPM）の本実装
    - 最早開始日、最早終了日、最遅開始日、最遅終了日、余裕日数（フロート）の算出
    - 余裕日数ゼロの工程の連鎖をクリティカルパスとして特定
    - プロジェクト全体の最短工期算出
    - `packages/shared/src/engines/schedule-engine.ts` に追加
    - _要件: 6.1, 6.2, 6.4_
  - [ ] C1.4 日付自動計算・バリデーションの実装
    - 開始日 + 工期 → 終了日の自動計算
    - 終了日 < 開始日のバリデーション
    - 循環依存検出（トポロジカルソートベース）
    - `packages/shared/src/engines/schedule-engine.ts` に追加
    - _要件: 4.2, 4.4, 4.5_
  - [ ] C1.5 工程管理エンジンの単体テスト
    - ガントチャートデータ生成、CPM 計算、日付自動計算、循環依存検出の各テスト
    - `packages/shared/test/engines/schedule-engine.test.ts` を作成
    - _要件: 4.2, 4.4, 4.5, 5.1, 6.1_
  - [ ]* C1.6 工程管理のプロパティテスト
    - **Property 11: 工程日付自動計算**
    - **Property 12: 日付バリデーション**
    - **Property 13: 循環依存検出**
    - **Property 14: クリティカルパス分析（CPM）**
    - fast-check で任意の工程グラフを生成し、各プロパティを検証
    - `packages/shared/test/properties/schedule.prop.test.ts` を作成
    - **検証対象: 要件 4.2, 4.4, 4.5, 6.1, 6.2, 6.4**

- [ ] C2. 工程管理 API・Usecase の本実装
  - [ ] C2.1 ScheduleUsecase の本実装
    - `generateGantt`, `analyzeCriticalPath` を本実装に置き換え
    - shared エンジン（Level 2）を呼び出す
    - `packages/backend/src/usecases/schedule-usecase.ts` を更新
    - _要件: 5.1, 6.1_
  - [ ] C2.2 工程管理 API ルートの本実装
    - スタブレスポンスを本実装に置き換え、`_stub: false` を返す
    - `packages/backend/src/api/schedule.ts` を更新
    - _要件: 5.1, 6.1_

- [ ] C3. フロントエンド: 工程情報タブの実装
  - [ ] C3.1 ScheduleTab コンポーネントの実装
    - 属性パネル内の工程情報タブ
    - 開始日、終了日、工期、依存関係（ドロップダウン + 依存タイプ選択）、進捗状態の入力フィールド
    - 開始日 + 工期 → 終了日の自動計算
    - 日付バリデーション、循環依存エラー表示
    - `packages/frontend/src/components/properties/ScheduleTab.tsx` を作成
    - _要件: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] C4. フロントエンド: ガントチャートの実装
  - [ ] C4.1 GanttChart コンポーネントの実装
    - SVG/Canvas ベースのガントチャート描画
    - 各ブロックの開始日・終了日・工期をバー形式で表示
    - 依存関係を矢印で接続
    - バークリック時の工程詳細ポップアップ
    - 表示スケール切り替え（日/週/月）
    - クリティカルパスのバーを赤色ハイライト
    - `packages/frontend/src/components/gantt/GanttChart.tsx` を作成
    - _要件: 5.1, 5.2, 5.3, 5.4, 6.3_

- [ ] C5. Phase 2 グループ C 結合テスト
  - [ ] C5.1 工程管理結合テスト
    - ブロックに工程情報設定 → ガントチャート生成 → クリティカルパス分析のフルフロー
    - 循環依存検出のテスト
    - `packages/backend/test/integration/phase2-group-c.test.ts` を作成
    - _要件: 4, 5, 6_

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- 工程管理エンジンは `packages/shared` に配置し、フロントエンド・バックエンド双方から利用可能
- ガントチャートはカスタム実装（SVG/Canvas）で Cloudscape との統合を優先
