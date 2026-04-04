# 技術設計書: IFC レゴ BIM シミュレーター

## 概要

本ドキュメントは、レゴブロック風の直感的操作で建設モデルを構築する Web アプリケーション「IFC レゴ BIM シミュレーター」の技術設計を定義する。

既存のボイラープレート `basic-serverless-app`（TypeScript / Hono / Vitest / モノレポ構成）を基盤とし、3D レンダリング、BIM シミュレーション、工程管理、AI 連携、IFC 入出力の各機能を段階的に構築する。

### 設計方針

- **モノレポ構成の維持**: `packages/frontend`、`packages/backend`、`packages/shared` の 3 パッケージ構成を維持
- **ヘキサゴナルアーキテクチャ**: バックエンドは既存の Port/Adapter パターンを踏襲
- **型安全**: Zod スキーマによるバリデーションと Hono RPC による E2E 型安全を活用
- **段階的実装**: P1（コア機能）→ P2（BIM シミュレーション・工程管理）→ P3（チェック・AI・分析）→ P4（先進機能）の順で実装
- **AI-Ready Backend**: ボイラープレートの「AgentCore / MCP 統合ガイド」に準拠し、AI エージェントが自律的にツール（Action Group）として機能を呼び出せるバックエンドを構築する

## 設計ドキュメント一覧

本設計書は以下のファイルに分割されています。必要なファイルだけを参照してください。

| ファイル | 内容 | 主な参照者 |
|----------|------|-----------|
| [architecture.md](design/architecture.md) | システムアーキテクチャ、決定事項、オフライン構成 | 全員 |
| [api.md](design/api.md) | API エンドポイント一覧、Agent API、AIPort、アダプター構成 | バックエンド担当 |
| [frontend.md](design/frontend.md) | フロントエンド構成、Shared パッケージ構成 | フロントエンド担当 |
| [data-models.md](design/data-models.md) | Zod スキーマ、データモデル、ER図 | 全員（特に shared 担当） |
| [properties.md](design/properties.md) | 正確性プロパティ 26件（PBT 仕様） | テスト担当 |
| [devops.md](design/devops.md) | フェーズ戦略、並行開発、バージョニング、マルチAIツール対応 | PM / リード |
| [testing.md](design/testing.md) | テスト戦略、結合テスト計画、エラーハンドリング | テスト担当 |

## 関連ドキュメント

- [要件定義書](requirements.md)
- [実装タスク（メイン）](tasks.md)
- [設計経緯](design-evolution.md)
