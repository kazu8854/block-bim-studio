import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import type { ProjectSummary } from '@block-bim-studio/shared';

const STATUS_LABEL: Record<ProjectSummary['status'], string> = {
  draft: '作成中',
  active: '進行中',
  completed: '完了',
  archived: 'アーカイブ',
};

export type ProjectCardProps = {
  project: ProjectSummary;
  onOpen: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function ProjectCard({
  project,
  onOpen,
  onDuplicate,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const costLabel =
    project.totalCost !== undefined
      ? `¥${project.totalCost.toLocaleString('ja-JP')}`
      : '—';

  const updated = new Date(project.updatedAt).toLocaleString('ja-JP');

  return (
    <div
      style={{
        border: '1px solid #d5dbdb',
        borderRadius: 8,
        background: '#ffffff',
        height: '100%',
        padding: 16,
      }}
    >
      <SpaceBetween size="m">
        <div
          style={{
            height: 120,
            borderRadius: 8,
            background: '#eaeded',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#687078',
            fontSize: 14,
          }}
        >
          3D サムネイル（別タスク）
        </div>
        <Box variant="h3">{project.name}</Box>
        <StatusIndicator
          type={
            project.status === 'archived'
              ? 'stopped'
              : project.status === 'draft'
                ? 'pending'
                : 'success'
          }
        >
          {STATUS_LABEL[project.status]}
        </StatusIndicator>
        <Box fontSize="body-s" color="text-body-secondary">
          更新: {updated}
        </Box>
        <Box fontSize="body-s">ブロック数: {project.blockCount}</Box>
        <Box fontSize="body-s">コスト概算: {costLabel}</Box>
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={onOpen}>
            開く
          </Button>
          <Button onClick={onDuplicate}>複製</Button>
          <Button onClick={onArchive}>アーカイブ</Button>
          <Button variant="normal" onClick={onDelete}>
            削除
          </Button>
        </SpaceBetween>
      </SpaceBetween>
    </div>
  );
}
