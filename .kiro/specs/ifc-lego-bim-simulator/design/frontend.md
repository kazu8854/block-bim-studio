# 技術設計書: IFC レゴ BIM シミュレーター — フロントエンド構成

## フロントエンド構成

```
packages/frontend/src/
├── api/
│   └── client.ts                  # Hono RPC クライアント（既存）
├── components/
│   ├── Layout.tsx                 # レイアウト（既存）
│   ├── canvas/
│   │   ├── Canvas3D.tsx           # Three.js 3D キャンバス（R3F）
│   │   ├── Block3D.tsx            # ブロック 3D メッシュコンポーネント
│   │   ├── SnapGuide.tsx          # スナップガイドライン表示
│   │   ├── SelectionHandler.tsx   # ブロック選択・操作ハンドル
│   │   └── SimulationOverlay.tsx  # 干渉/構造チェック結果のオーバーレイ
│   ├── palette/
│   │   └── BlockPalette.tsx       # ブロックパレット（カテゴリ・検索）
│   ├── properties/
│   │   ├── PropertyPanel.tsx      # 属性パネル
│   │   └── ScheduleTab.tsx        # 工程情報タブ
│   ├── gantt/
│   │   └── GanttChart.tsx         # ガントチャート
│   ├── dashboard/
│   │   └── Dashboard.tsx          # BIM ダッシュボード
│   └── project/
│       ├── ProjectList.tsx        # プロジェクト一覧
│       └── ProjectCard.tsx        # プロジェクトカード
├── stores/
│   ├── projectStore.ts            # プロジェクト状態（Zustand）
│   ├── canvasStore.ts             # キャンバス状態（選択、カメラ）
│   └── simulationStore.ts        # シミュレーション結果状態
├── hooks/
│   ├── useDragDrop.ts             # ドラッグ＆ドロップ
│   ├── useSnap.ts                 # スナップ計算
│   └── useSimulation.ts          # シミュレーション実行
└── pages/
    ├── ProjectListPage.tsx        # プロジェクト一覧ページ
    ├── EditorPage.tsx             # メインエディタページ
    └── DashboardPage.tsx          # ダッシュボードページ
```

## Shared パッケージ構成

計算ロジック（シミュレーションエンジン、工程管理エンジン、IFC パーサー/シリアライザー）は `packages/shared` に配置し、フロントエンド・バックエンド双方から利用可能にする。

```
packages/shared/src/
├── index.ts
├── models/
│   ├── user.ts                    # 既存
│   ├── block.ts                   # ブロックモデル
│   ├── project.ts                 # プロジェクトモデル
│   ├── schedule.ts                # 工程情報モデル
│   ├── simulation-result.ts       # シミュレーション結果モデル
│   ├── ai-result.ts               # AI 連携結果モデル（BlockGenerationResult, ImageAnalysisResult, StructureSuggestion）
│   └── property-set.ts            # PropertySet モデル
├── api/
│   └── responses.ts               # 既存
├── engines/
│   ├── quantity-engine.ts         # 数量算出エンジン
│   ├── cost-engine.ts             # コスト概算エンジン
│   ├── clash-engine.ts            # 干渉チェックエンジン
│   ├── schedule-engine.ts         # 工程管理エンジン（ガントチャート・クリティカルパス）
│   ├── structure-check-engine.ts  # 構造チェックエンジン
│   ├── regulation-check-engine.ts # 法規チェックエンジン
│   ├── environment-engine.ts      # 環境シミュレーションエンジン
│   └── safety-engine.ts           # 安全管理エンジン
├── ifc/
│   ├── ifc-parser.ts              # IFC パーサー
│   ├── ifc-serializer.ts          # IFC シリアライザー
│   └── ifc-types.ts               # IFC 型定義
└── serialization/
    ├── project-serializer.ts      # プロジェクト JSON シリアライザー
    └── project-deserializer.ts    # プロジェクト JSON デシリアライザー
```
