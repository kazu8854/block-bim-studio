# 実装タスク: グループ B（BIM シミュレーション）

## 概要

Phase 2 で実装するグループ B のタスク詳細。数量算出、コスト概算、干渉チェックの各シミュレーションエンジンの本実装と、対応するバックエンド API・フロントエンド UI を含む。

## タスク

- [ ] B1. 数量算出エンジンの本実装（Level 2）
  - [ ] B1.1 API 契約テストの確認・拡充
    - `POST /api/simulation/quantity` の契約テストが通ることを確認
    - 正常系・異常系（ブロック 0 個）のテストケースを追加
    - `packages/backend/test/simulation.test.ts` を更新
    - _要件: 8.1, 8.2, 8.4_
  - [ ] B1.2 数量算出エンジンの本実装
    - 各ブロックの `Qto_BaseQuantities` から体積・面積・長さを集計
    - 要素タイプ別（壁、柱、梁、スラブ）のグループ化
    - プロジェクト全体の合計算出
    - `packages/shared/src/engines/quantity-engine.ts` を Level 2 に更新
    - _要件: 8.1, 8.2_
  - [ ] B1.3 数量算出エンジンの単体テスト
    - 具体的なブロック配置での数量算出結果の検証
    - `packages/shared/test/engines/quantity-engine.test.ts` を作成
    - _要件: 8.1, 8.2_
  - [ ]* B1.4 数量算出のプロパティテスト
    - **Property 8: 数量算出の正確性**
    - fast-check で任意のブロック集合を生成し、タイプ別合計 = 全体合計を検証
    - `packages/shared/test/properties/simulation.prop.test.ts` を作成
    - **検証対象: 要件 8.1, 8.2**

- [ ] B2. コスト概算エンジンの本実装（Level 2）
  - [ ] B2.1 コスト概算エンジンの本実装
    - 各ブロックの数量（Qto_BaseQuantities）× 単価（Pset_Cost）でコスト算出
    - 要素タイプ別の内訳とプロジェクト合計
    - Pset_Cost 未設定ブロックの除外と未設定リスト生成
    - `packages/shared/src/engines/cost-engine.ts` を Level 2 に更新
    - _要件: 9.1, 9.2, 9.4_
  - [ ] B2.2 コスト概算エンジンの単体テスト
    - Pset_Cost 設定済み/未設定ブロック混在ケースの検証
    - `packages/shared/test/engines/cost-engine.test.ts` を作成
    - _要件: 9.1, 9.2, 9.4_
  - [ ]* B2.3 コスト概算のプロパティテスト
    - **Property 9: コスト概算の正確性**
    - fast-check で任意のブロック集合を生成し、タイプ別内訳合計 = プロジェクト合計、未設定ブロックの除外を検証
    - `packages/shared/test/properties/simulation.prop.test.ts` に追加
    - **検証対象: 要件 9.1, 9.2, 9.4**

- [ ] B3. 干渉チェックエンジンの本実装（Level 2）
  - [ ] B3.1 干渉チェックエンジンの本実装
    - 全ブロックペアのバウンディングボックス重なり検出
    - 干渉箇所の座標と干渉体積の算出
    - ブロック 1 個以下の場合のメッセージ返却
    - `packages/shared/src/engines/clash-engine.ts` を Level 2 に更新
    - _要件: 10.1, 10.2, 10.4_
  - [ ] B3.2 干渉チェックエンジンの単体テスト
    - 重なるブロックペア、重ならないブロックペア、1 個以下のケースを検証
    - `packages/shared/test/engines/clash-engine.test.ts` を作成
    - _要件: 10.1, 10.2, 10.4_
  - [ ]* B3.3 干渉チェックのプロパティテスト
    - **Property 10: 干渉チェック（バウンディングボックス重なり検出）**
    - fast-check で任意の 2 ブロックを生成し、重なり判定の正確性と交差点座標の妥当性を検証
    - `packages/shared/test/properties/simulation.prop.test.ts` に追加
    - **検証対象: 要件 10.1, 10.2**

- [ ] B4. シミュレーション API・Usecase の本実装
  - [ ] B4.1 SimulationUsecase の本実装
    - `calculateQuantity`, `calculateCost`, `checkClash` を本実装に置き換え
    - shared エンジン（Level 2）を呼び出す
    - `packages/backend/src/usecases/simulation-usecase.ts` を更新
    - _要件: 8.1, 9.1, 10.1_
  - [ ] B4.2 シミュレーション API ルートの本実装
    - スタブレスポンスを本実装に置き換え、`_stub: false` を返す
    - `packages/backend/src/api/simulation.ts` を更新
    - _要件: 8.1, 9.1, 10.1_
  - [ ] B4.3 Agent 専用エンドポイント（simulation 系）の本実装
    - `/api/agent/quantity`, `/api/agent/cost`, `/api/agent/clash` のスタブを本実装に置き換え
    - `packages/backend/src/api/agent.ts` を更新
    - _要件: 設計書 Agent 専用エンドポイント_

- [ ] B5. フロントエンド: シミュレーション結果表示
  - [ ] B5.1 シミュレーション結果パネルの実装
    - 数量算出結果（要素タイプ別テーブル）、コスト概算結果（内訳 + 合計）、干渉チェック結果（干渉ペアリスト）の表示
    - CSV エクスポートボタン
    - Zustand `simulationStore` の実装
    - `packages/frontend/src/stores/simulationStore.ts` を作成
    - `packages/frontend/src/hooks/useSimulation.ts` を作成
    - _要件: 8.2, 8.3, 9.2, 9.3, 10.2_
  - [ ] B5.2 干渉箇所の 3D ハイライト表示
    - 干渉チェック結果に基づき、キャンバス上で干渉箇所を赤色ハイライト
    - `packages/frontend/src/components/canvas/SimulationOverlay.tsx` を作成
    - _要件: 10.3_

- [ ] B6. Phase 2 グループ B 結合テスト
  - [ ] B6.1 BIM シミュレーション結合テスト
    - ブロック配置 → 数量算出 → コスト概算のフルフロー
    - ブロック配置 → 干渉チェック → 結果返却のフルフロー
    - `packages/backend/test/integration/phase2-group-b.test.ts` を作成
    - _要件: 8, 9, 10_

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- 各エンジンは `packages/shared` に配置し、フロントエンド・バックエンド双方から利用可能
- Phase 0 で作成したスタブを Level 2 に置き換える形で進める
