# ブランチ戦略

## 概要

本プロジェクトはフェーズ別・グループ別の段階的開発を行う。各フェーズの開発ブランチで作業し、完了後に `main` へマージする。

**現在のリモート作業ブランチ:** `cursor-impl`（`origin/cursor-impl`）。旧名 `ph0/initial-setup` はリポジトリ上で統合・削除されている場合があります。ローカルで作業する際は `git fetch origin && git checkout cursor-impl && git pull` のように `cursor-impl` を追跡してください。

## ブランチ構成

```
main ← 安定版。直接コミット禁止。PR 経由のみ。
│
├── ph0/initial-setup          ← Phase 0: インターフェース定義 + スタブ実装
│                                 → main にマージ後、以降のブランチのベースになる
│
├── ph1/group-a-core           ← Phase 1: グループ A（コア機能）
├── ph1/3d-canvas              ← Phase 1: 3D キャンバス（並行開発可）
│
├── ph2/group-b-simulation     ← Phase 2: グループ B（BIM シミュレーション）
├── ph2/group-c-schedule       ← Phase 2: グループ C（工程管理）（並行開発可）
│
├── ph3/polish                 ← Phase 3: ブラッシュアップ + 品質向上
│
├── ph4/group-d-ai             ← Phase 4: グループ D（AI 活用）
├── ph4/group-e-check          ← Phase 4: グループ E（建設チェック）（並行開発可）
├── ph4/group-f-data           ← Phase 4: グループ F（データ連携）（並行開発可）
```

## ルール

### main ブランチ
- 直接コミット禁止
- PR 経由でのみマージ
- マージ前に全パッケージの `npm run build` + `npm run test` が通ること

### フェーズブランチ
- 命名規則: `ph{N}/{グループ名 or 機能名}`
- Phase 0 は `main` から作成
- Phase 1 以降は Phase 0 マージ後の `main` から作成
- 同じフェーズ内の並行開発ブランチは互いに独立

### マージ順序
```
1. ph0/initial-setup → main（Phase 0 完了）
2. ph1/* → main（Phase 1 完了。並行ブランチは順次マージ）
3. ph2/* → main（Phase 2 完了。並行ブランチは順次マージ）
4. ph3/polish → main（Phase 3 完了）
5. ph4/* → main（Phase 4 完了。並行ブランチは順次マージ）
```

### shared パッケージの変更
- shared の変更を含む PR は、影響を受ける全ブランチの担当者がレビュー
- shared の破壊的変更は、他のブランチが取り込めるよう先に main にマージ

### コンフリクト回避
- タスクファイル（`tasks/group-*.md`）はグループ単位で分割済み
- 同じグループのタスクファイルは、そのグループの担当ブランチのみが更新
- 異なるグループの担当者が同じファイルを触らない構造

## AI ツールでの開発時

各 AI ツール（Kiro、Claude Code、Cursor、Cline 等）で開発する際:
1. 担当グループのブランチをチェックアウト
2. `AI_INSTRUCTIONS.md` を参照してルールを確認
3. 担当グループのタスクファイル（`tasks/group-*.md`）を参照
4. 実装完了後、PR を作成して main へマージ
