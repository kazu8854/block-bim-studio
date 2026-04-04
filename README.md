# Block BIM Studio

レゴブロックを組み立てるような直感的な操作で建設モデルを構築し、BIM（Building Information Modeling）業務をシミュレーションする Web アプリケーション。

## コンセプト

「建設業の勉強 × AI でどこまで便利になるかの検証」

- ブロックパレットから標準的な建設要素（壁、柱、梁、スラブ、窓、ドアなど）を選択し、3D キャンバス上でドラッグ＆ドロップで組み立て
- 各ブロックに属性情報（材質、寸法、コスト単価、工程情報など）を設定
- 数量算出・コスト概算・干渉チェック・工程管理シミュレーションなどの BIM 業務を実行
- AI 活用機能（構造提案、自然言語モデリング、画像認識）
- 建設業務チェック（構造チェック、法規チェック、環境シミュレーション、安全管理）
- 組み立てたモデルは IFC 形式でエクスポートし、他の BIM ソフトウェアとデータ連携可能

## 技術スタック

- **フロントエンド**: React + Vite + Three.js (React Three Fiber) + Cloudscape Design System
- **バックエンド**: Hono (TypeScript) + AWS Lambda
- **3D レンダリング**: Three.js + React Three Fiber
- **IFC パース**: web-ifc (WebAssembly)
- **状態管理**: Zustand
- **バリデーション**: Zod
- **テスト**: Vitest + fast-check (Property-Based Testing)
- **AI 連携**: Amazon Bedrock (本番) / Ollama (ローカル開発)
- **インフラ**: AWS CDK (TypeScript)

## ディレクトリ構成

```
block-bim-studio/
├── packages/
│   ├── frontend/          # React + Vite + Three.js
│   ├── backend/           # Hono API
│   ├── shared/            # Zod スキーマ・型定義・計算エンジン
│   └── infrastructure/    # AWS CDK
├── docs/
│   └── ai-context/        # AI ツール向け補足コンテキスト
├── .kiro/specs/           # 要件・設計・タスク
├── AI_INSTRUCTIONS.md     # 全 AI ツール共通ルール
├── CLAUDE.md              # Claude Code 用設定
├── .cursorrules           # Cursor 用設定
├── .clinerules            # Cline 用設定
└── BRANCHING.md           # ブランチ戦略
```

## セットアップ

```bash
git clone https://github.com/kazu8854/block-bim-studio.git
cd block-bim-studio
npm install
```

## ローカル開発（Mock モード — AWS 接続不要）

```bash
npm run dev:mock
```

`MOCK_AWS=true` が自動設定され、完全オフラインで開発可能。

## ライセンス

[MIT License](LICENSE)

## ⚠️ Disclaimer（免責事項）

- **Unofficial / Personal Work:** 本リポジトリは完全に個人のプロジェクトであり、所属企業や組織とは一切関係がありません。
- **AWS Costs:** 本構成を AWS へデプロイすることによって発生した利用料金や損害について、作者は一切の責任を負いません。
- **No Warranty:** 本ソフトウェアは「現状有姿」で提供され、いかなる保証もありません。
- **建設業務の正確性:** 本アプリケーションの構造チェック・法規チェック・シミュレーション結果は学習・検証目的であり、実際の建設業務における設計判断の根拠として使用しないでください。
