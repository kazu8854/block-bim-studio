# 実装タスク: グループ F（データ連携・分析）

## 概要

Phase 4 で実装するグループ F のタスク詳細。BIM ダッシュボード、IFC 入出力、プロジェクト比較の各機能の本実装を含む。

## タスク

- [ ] F1. IFC パーサー・シリアライザーの本実装（Level 2）
  - [ ] F1.1 API 契約テストの確認・拡充
    - `POST /api/ifc/export/:projectId`, `POST /api/ifc/import` の契約テストが通ることを確認
    - `packages/backend/test/ifc.test.ts` を更新
    - _要件: 11.1, 12.1_
  - [ ] F1.2 IFC シリアライザーの本実装
    - ブロック配置と属性情報を IFC4 形式に変換
    - IFC ヘッダー情報（FILE_DESCRIPTION, FILE_NAME, FILE_SCHEMA）の出力
    - PropertySet → IfcPropertySet エンティティの変換
    - web-ifc ライブラリを使用
    - `packages/shared/src/ifc/ifc-serializer.ts` を Level 2 に更新
    - _要件: 11.1, 11.2, 11.3_
  - [ ] F1.3 IFC パーサーの本実装
    - IFC ファイル（IFC2x3/IFC4）の解析
    - 建設要素のブロックリストへの変換（要素タイプ、ジオメトリ、PropertySet 抽出）
    - 無効/破損ファイルのエラーハンドリング
    - web-ifc ライブラリを使用
    - `packages/shared/src/ifc/ifc-parser.ts` を Level 2 に更新
    - _要件: 12.1, 12.2, 12.3_
  - [ ] F1.4 IFC パーサー・シリアライザーの単体テスト
    - エクスポート → インポートのラウンドトリップ、無効ファイルのエラーハンドリングを検証
    - `packages/shared/test/ifc/ifc-parser.test.ts`, `ifc-serializer.test.ts` を作成
    - _要件: 11.1, 12.1, 12.3_
  - [ ]* F1.5 IFC ラウンドトリップのプロパティテスト
    - **Property 2: IFC ラウンドトリップ**
    - **Property 24: IFC PropertySet マッピング**
    - fast-check で任意のブロック集合を生成し、シリアライズ → パース → 再シリアライズ → 再パースの等価性を検証
    - `packages/shared/test/ifc/ifc-roundtrip.prop.test.ts` を作成
    - **検証対象: 要件 11.3, 12.1, 12.2, 12.4**

- [ ] F2. IFC API の本実装
  - [ ] F2.1 IFC API ルートの本実装
    - `POST /api/ifc/export/:projectId`: プロジェクトデータを IFC ファイルに変換してダウンロード
    - `POST /api/ifc/import`: IFC ファイルをアップロードしてブロックリストに変換
    - スタブレスポンスを本実装に置き換え
    - `packages/backend/src/api/ifc.ts` を更新
    - _要件: 11.1, 12.1_
  - [ ] F2.2 フロントエンド: IFC エクスポート/インポート UI
    - エクスポートボタン（IFC ファイルダウンロード）
    - インポート（ファイルアップロード → プレビュー → 確定）
    - _要件: 11.1, 12.1, 12.2_

- [ ] F3. ダッシュボードの本実装
  - [ ] F3.1 API 契約テストの確認・拡充
    - `GET /api/dashboard/:projectId` の契約テストが通ることを確認
    - `packages/backend/test/dashboard.test.ts` を更新
    - _要件: 22.1_
  - [ ] F3.2 ダッシュボード API・Usecase の本実装
    - プロジェクトデータから材料別数量、コスト内訳、進捗率を集計
    - スタブレスポンスを本実装に置き換え
    - `packages/backend/src/api/dashboard.ts` を更新
    - _要件: 22.1, 22.2, 22.3_
  - [ ] F3.3 フロントエンド: Dashboard コンポーネントの実装
    - 材料別ブロック数量の棒グラフ/円グラフ（Recharts）
    - コスト概算合計と要素タイプ別内訳のグラフ
    - 全体進捗率のプログレスバー
    - データ変更時の自動再計算
    - PNG/PDF エクスポート機能
    - ブロック未配置時のメッセージ表示
    - `packages/frontend/src/components/dashboard/Dashboard.tsx` を作成
    - `packages/frontend/src/pages/DashboardPage.tsx` を作成
    - _要件: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  - [ ]* F3.4 ダッシュボード進捗率のプロパティテスト
    - **Property 21: ダッシュボード進捗率計算**
    - **検証対象: 要件 22.3**

- [ ] F4. プロジェクト比較の本実装
  - [ ] F4.1 API 契約テストの確認・拡充
    - `POST /api/compare` の契約テストが通ることを確認
    - `packages/backend/test/compare.test.ts` を更新
    - _要件: 23.1_
  - [ ] F4.2 プロジェクト比較 API・Usecase の本実装
    - 2 件以上のプロジェクトのコスト概算合計、ブロック数、延べ床面積、工期を集約
    - 単位面積あたりのコスト自動算出
    - 1 件以下の場合のメッセージ返却
    - スタブレスポンスを本実装に置き換え
    - `packages/backend/src/api/compare.ts` を更新
    - _要件: 23.1, 23.3, 23.5_
  - [ ] F4.3 フロントエンド: プロジェクト比較 UI の実装
    - 比較対象プロジェクト選択
    - 並列棒グラフ/テーブル形式での比較表示
    - CSV エクスポートボタン
    - _要件: 23.1, 23.2, 23.3, 23.4_
  - [ ]* F4.4 プロジェクト比較のプロパティテスト
    - **Property 23: プロジェクト比較データ集約**
    - **検証対象: 要件 23.1, 23.3**

- [ ] F5. Phase 4 グループ F 結合テスト
  - [ ] F5.1 データ連携結合テスト
    - IFC エクスポート → インポートのラウンドトリップ
    - ダッシュボードデータの集計正確性
    - 複数プロジェクト比較のデータ集約正確性
    - `packages/backend/test/integration/phase4-group-f.test.ts` を作成
    - _要件: 11, 12, 22, 23_

## 備考

- `*` 付きのタスクはオプション（スキップ可能）
- IFC パーサー/シリアライザーは web-ifc（WebAssembly ベース）を使用
- ダッシュボードのグラフ描画は Recharts を使用
- プロジェクト比較は 2 件以上のプロジェクトが必要
