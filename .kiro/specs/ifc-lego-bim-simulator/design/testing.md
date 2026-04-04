# 技術設計書: IFC レゴ BIM シミュレーター — テスト戦略・エラーハンドリング

## エラーハンドリング

### フロントエンド

| エラー種別 | 対応方針 |
|-----------|---------|
| API 通信エラー | Cloudscape FlashBar でエラーメッセージ表示。リトライボタン提供 |
| バリデーションエラー | 入力フィールド直下にインラインエラー表示（Cloudscape FormField） |
| 3D レンダリングエラー | WebGL 非対応時はフォールバックメッセージ表示 |
| ファイルアップロードエラー | 対応形式・サイズ上限を含むエラーメッセージ表示 |
| AI 生成エラー | エラーメッセージと再試行ボタン表示 |

### バックエンド

| HTTP ステータス | 用途 |
|----------------|------|
| 200 | 正常レスポンス |
| 201 | リソース作成成功 |
| 400 | バリデーションエラー（Zod パースエラー詳細を含む） |
| 404 | リソース未検出（プロジェクト ID 不存在など） |
| 413 | ファイルサイズ超過 |
| 415 | サポート対象外のファイル形式 |
| 422 | ビジネスロジックエラー（循環依存、ブロック不足など） |
| 500 | 内部サーバーエラー |

### エラーレスポンス形式

既存の `ApiResponse` 型を拡張し、エラー詳細を含める。

```typescript
// 既存の ApiResponse を活用
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>; // バリデーションエラー詳細など
}
```

### シミュレーションエンジンのエラー

各シミュレーションエンジンは、前提条件が満たされない場合にメッセージ付きの結果を返す（例外をスローしない）。

```typescript
// 例: 干渉チェックでブロックが1個以下の場合
{
  success: true,
  data: {
    clashes: [],
    message: "干渉チェックにはブロックが2個以上必要です"
  }
}
```

## テスト戦略

### API ファーストテスト戦略

本プロジェクトでは **API ファースト** のテスト戦略を採用する。API の入出力（契約）が守られていれば、内部実装は自由に変更可能。分散開発の各担当者は、API テストさえ通れば内部の実装・テストに集中できる。

**テストの優先順位:**

1. **API 契約テスト（最重要）**: 各エンドポイントの入力 Zod スキーマ → 出力 Zod スキーマの整合性。Hono の `app.request()` を使ったインメモリテスト
2. **エンジン単体テスト**: shared パッケージの計算ロジック。プロパティベーステスト含む
3. **コンポーネントテスト**: フロントエンドの UI コンポーネント
4. **統合テスト**: グループ内のエンドポイント間のデータフロー

**API 契約テストの例:**

```typescript
// backend/test/projects.test.ts
import { ProjectSchema, ProjectSummarySchema } from '@ifc-lego-bim-simulator/shared';

describe('Projects API Contract', () => {
  it('POST /api/projects returns valid ProjectSchema', async () => {
    const res = await app.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', metadata: {} }),
    });
    const json = await res.json();
    // Zod でパースして型の整合性を検証
    expect(() => ProjectSchema.parse(json.data)).not.toThrow();
  });

  it('GET /api/projects returns array of ProjectSummarySchema', async () => {
    const res = await app.request('/api/projects');
    const json = await res.json();
    expect(() => z.array(ProjectSummarySchema).parse(json.data)).not.toThrow();
  });
});
```

**ポイント:** このテストはスタブでも本実装でも通る。レスポンスの「型」が正しいことだけを検証する。値の正確性はエンジン単体テストで担保する。

### フェーズ別結合テスト計画

各フェーズの完了時に実施する結合テストの想定を以下に整理する。フェーズが進むにつれて、スタブが本実装に置き換わり、結合テストの範囲が広がっていく。

#### Phase 0: 全スタブ（Mock）結合テスト

**対象:** 全エンドポイント（Level 0〜1 スタブ）
**目的:** API 契約（型の整合性）の確認。全エンドポイントがスタブレスポンスを返し、Zod スキーマに準拠していること。

**結合テスト内容:**
- 全エンドポイントに対する Zod スキーマ準拠テスト（契約テスト）
- MockDbAdapter（Level 1）を使った CRUD フローテスト（作成 → 取得 → 更新 → 削除）
- Hono RPC クライアントからの型推論が正しく動作すること
- Agent 専用エンドポイントのスタブレスポンス確認
- OpenAPI スキーマ出力の妥当性確認

**完了基準:**
- `npm run test` が全パッケージで通る
- `npm run dev:mock` で全エンドポイントがレスポンスを返す
- 全レスポンスに `_stub: true` が含まれる

#### Phase 1: 3D エンジン基礎 + グループ A（コア機能）結合テスト

**対象:** グループ A エンドポイント（Level 2 本実装）+ 3D キャンバス基礎
**目的:** コア機能のエンドツーエンド動作確認。ブロックの CRUD、属性編集、プロジェクト管理が本実装で正しく動作すること。

**結合テスト内容:**
- プロジェクト作成 → ブロック追加 → 属性編集 → 保存 → 再読み込みのフルフロー
- プロジェクト一覧の検索・ソート・フィルタリング
- プロジェクト複製・削除・アーカイブ
- JSON シリアライズ/デシリアライズのラウンドトリップ（Property 1）
- ブロックパレットからの選択 → 3D キャンバスへの配置（フロントエンド結合）
- Agent 専用エンドポイント（project 系）の本実装レスポンス確認

**完了基準:**
- グループ A の全エンドポイントが `_stub: false` を返す
- グループ A の全 API 契約テスト + 統合テストが通る
- 3D キャンバスでブロックの配置・移動・回転・削除が動作する
- 他グループ（B〜F）はスタブのまま（`_stub: true`）

#### Phase 2: + グループ B（BIM シミュレーション）+ グループ C（工程管理）結合テスト

**対象:** グループ A（V1）+ グループ B・C エンドポイント（Level 2 本実装）
**目的:** BIM シミュレーションと工程管理がコア機能と連携して正しく動作すること。

**結合テスト内容:**
- ブロック配置 → 数量算出 → コスト概算のフルフロー（グループ A → B 連携）
- ブロック配置 → 干渉チェック → キャンバス上のハイライト表示
- ブロックに工程情報設定 → ガントチャート生成 → クリティカルパス分析のフルフロー（グループ A → C 連携）
- 数量算出・コスト概算の正確性検証（Property 8, 9）
- 干渉チェックの正確性検証（Property 10）
- 循環依存検出（Property 13）、クリティカルパス分析（Property 14）
- CSV エクスポートの動作確認
- Agent 専用エンドポイント（simulation, schedule 系）の本実装レスポンス確認

**完了基準:**
- グループ A, B, C の全エンドポイントが `_stub: false` を返す
- グループ間のデータフロー（ブロック → シミュレーション → 工程管理）が整合
- 全プロパティテスト（Property 1, 8, 9, 10, 11, 12, 13, 14）が通る

#### Phase 3: ブラッシュアップ + 品質向上

**対象:** グループ A, B, C（V1）の品質向上 + エッジケース対応
**目的:** Phase 1〜2 で実装した機能の品質を磨き込み、エッジケースやエラーハンドリングを強化する。

**結合テスト内容:**
- 大量ブロック（100個以上）でのパフォーマンステスト（数量算出、干渉チェック、ガントチャート）
- エラーハンドリングの網羅テスト（無効入力、空プロジェクト、ブロック不足）
- 4D シミュレーション（工程アニメーション）の動作確認
- フロントエンド UX の磨き込み（スナップ機能、操作ハンドル、レスポンシブ対応）
- プロパティベーステストの拡充（全 Property のイテレーション数を 100 → 500 に増加）
- Agent API の OpenAPI スキーマと実際のレスポンスの整合性確認

**完了基準:**
- 100 ブロックでの操作がストレスなく動作する
- 全エラーケースで適切なエラーメッセージが返る
- プロパティテストが 500 イテレーションで全て通る

#### Phase 4: グループ D（AI）+ グループ E（建設チェック）+ グループ F（データ連携）結合テスト

**対象:** 全グループ（A〜F）の本実装
**目的:** AI 連携、建設業務チェック、データ連携・分析が全体と統合して正しく動作すること。

**結合テスト内容:**
- AI 構造提案: ブロック配置 → 提案生成 → プレビュー → 適用のフルフロー（グループ A → D 連携）
- 自然言語モデリング: テキスト入力 → ブロック生成 → キャンバス配置のフルフロー
- 構造チェック: ブロック配置 → 構造ルール検証 → 違反ハイライト（グループ A → E 連携）
- 法規チェック: プロジェクト設定（敷地面積、用途地域）→ 法規チェック実行 → 結果表示
- 環境シミュレーション: 窓ブロック配置 → 日射量・熱損失概算
- 安全管理シミュレーション: 工程情報 + ブロック配置 → 危険箇所検出（グループ C → E 連携）
- ダッシュボード: 全シミュレーション結果のリアルタイム可視化（グループ B, C → F 連携）
- 複数プロジェクト比較: 2 件以上のプロジェクト → 比較データ集約 → グラフ表示
- IFC エクスポート/インポートのラウンドトリップ（Property 2）
- Agent API 全エンドポイントの本実装レスポンス確認
- Ollama 連携テスト（MOCK_AWS=true + Ollama 起動状態での AI 機能動作確認）

**完了基準:**
- 全グループ（A〜F）の全エンドポイントが `_stub: false` を返す
- 全 26 Property のプロパティテストが通る
- Agent API の全エンドポイントが OpenAPI スキーマと整合
- Ollama 連携で AI 機能が動作する（ローカル環境）

#### フェーズ別結合テストサマリー

| フェーズ | V1 グループ | スタブグループ | 主要テスト観点 | Property テスト |
|----------|-----------|-------------|-------------|----------------|
| Phase 0 | なし | A, B, C, D, E, F | 型の整合性、契約テスト | なし（スキーマ検証のみ） |
| Phase 1 | A | B, C, D, E, F | コア CRUD、3D 基礎、JSON ラウンドトリップ | 1, 3, 4, 5, 6, 7 |
| Phase 2 | A, B, C | D, E, F | BIM シミュレーション、工程管理、グループ間連携 | + 8, 9, 10, 11, 12, 13, 14 |
| Phase 3 | A, B, C（品質向上） | D, E, F | パフォーマンス、エッジケース、UX | 全 Property 500 イテレーション |
| Phase 4 | A, B, C, D, E, F | なし | AI 連携、建設チェック、データ分析、全体統合 | 全 26 Property |

### テストフレームワーク

- **ユニットテスト / プロパティテスト**: Vitest（既存構成を踏襲）
- **プロパティベーステスト**: fast-check（Vitest と統合）
- **フロントエンドテスト**: @testing-library/react（既存構成を踏襲）
- **E2E テスト**: 将来的に Playwright を検討

### テスト構成

```
packages/
├── shared/
│   └── test/
│       ├── engines/
│       │   ├── quantity-engine.test.ts      # 数量算出エンジン
│       │   ├── cost-engine.test.ts          # コスト概算エンジン
│       │   ├── clash-engine.test.ts         # 干渉チェックエンジン
│       │   ├── schedule-engine.test.ts      # 工程管理エンジン
│       │   ├── structure-check.test.ts      # 構造チェック
│       │   ├── regulation-check.test.ts     # 法規チェック
│       │   ├── environment-engine.test.ts   # 環境シミュレーション
│       │   └── safety-engine.test.ts        # 安全管理
│       ├── serialization/
│       │   ├── project-serializer.test.ts   # JSON シリアライズ
│       │   └── project-serializer.prop.test.ts # プロパティテスト
│       ├── ifc/
│       │   ├── ifc-parser.test.ts           # IFC パーサー
│       │   ├── ifc-serializer.test.ts       # IFC シリアライザー
│       │   └── ifc-roundtrip.prop.test.ts   # ラウンドトリッププロパティテスト
│       └── properties/
│           ├── simulation.prop.test.ts      # シミュレーションプロパティテスト
│           ├── schedule.prop.test.ts        # 工程管理プロパティテスト
│           └── check.prop.test.ts           # チェック系プロパティテスト
├── backend/
│   └── test/
│       ├── users.test.ts                    # 既存
│       ├── projects.test.ts                 # プロジェクト API
│       ├── simulation.test.ts               # シミュレーション API
│       ├── schedule.test.ts                 # 工程管理 API
│       ├── agent.test.ts                    # Agent 専用エンドポイント
│       └── adapters/
│           ├── ai-adapter-factory.test.ts   # AI アダプターファクトリ
│           └── mock-ai-adapter.test.ts      # Mock AI アダプター
└── frontend/
    └── test/
        ├── components/
        │   ├── BlockPalette.test.tsx         # ブロックパレット
        │   ├── PropertyPanel.test.tsx        # 属性パネル
        │   └── ProjectList.test.tsx          # プロジェクト一覧
        └── stores/
            └── projectStore.test.ts         # 状態管理
```

### デュアルテストアプローチ

**ユニットテスト（example-based）**:
- 具体的なシナリオの検証（ブロック配置、UI インタラクション）
- エッジケース（空プロジェクト、ブロック不足、無効入力）
- 統合ポイント（API エンドポイント、データストア連携）

**プロパティベーステスト（property-based）**:
- fast-check ライブラリを使用
- 各プロパティテストは最低 100 回のイテレーション
- 各テストにはデザインドキュメントのプロパティ番号をタグ付け
- タグ形式: `Feature: ifc-lego-bim-simulator, Property {number}: {property_text}`

### プロパティテストの優先順位

| 優先度 | プロパティ | 理由 |
|--------|-----------|------|
| 高 | Property 1 (JSON ラウンドトリップ) | データ永続化の基盤 |
| 高 | Property 2 (IFC ラウンドトリップ) | 外部連携の正確性 |
| 高 | Property 10 (干渉チェック) | 幾何計算の正確性 |
| 高 | Property 14 (クリティカルパス) | グラフアルゴリズムの正確性 |
| 高 | Property 13 (循環依存検出) | グラフアルゴリズムの正確性 |
| 中 | Property 8, 9 (数量・コスト) | 集計計算の正確性 |
| 中 | Property 15, 16, 17 (構造・法規チェック) | ルールベース検証 |
| 中 | Property 18, 19 (環境シミュレーション) | 物理計算の正確性 |
| 低 | Property 3, 4, 5 (検索・ソート) | 標準的なフィルタリング |
| 低 | Property 25, 26 (入力バリデーション) | 単純なバリデーション |

### テスト実行

```bash
# shared パッケージのテスト（エンジン + プロパティテスト）
cd packages/shared && npx vitest run

# backend パッケージのテスト（API テスト）
cd packages/backend && MOCK_AWS=true npx vitest run

# frontend パッケージのテスト（コンポーネントテスト）
cd packages/frontend && npx vitest run
```
