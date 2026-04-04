import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import Select, { type SelectProps } from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { ProjectSummary } from '@block-bim-studio/shared';
import { useMemo, useState } from 'react';
import { ProjectCard } from '@/components/project/ProjectCard';

export type ProjectSortKey =
  | 'status'
  | 'updatedAt'
  | 'blockCount'
  | 'totalCost';

export type ProjectListProps = {
  projects: ProjectSummary[];
  loading?: boolean;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
};

const SORT_OPTIONS: SelectProps.Option[] = [
  { label: '更新日時（新しい順）', value: 'updatedAt-desc' },
  { label: 'ステータス', value: 'status-asc' },
  { label: 'ブロック数（多い順）', value: 'blockCount-desc' },
  { label: 'コスト概算（高い順）', value: 'totalCost-desc' },
];

export function ProjectList({
  projects,
  loading,
  onOpen,
  onDuplicate,
  onArchive,
  onDelete,
}: ProjectListProps) {
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState<string>('updatedAt-desc');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    const parts = sortValue.split('-');
    const key = parts[0] as ProjectSortKey;
    const dir = parts[1] as 'asc' | 'desc';
    const sign = dir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
      if (key === 'updatedAt') {
        return a.updatedAt.localeCompare(b.updatedAt) * sign;
      }
      if (key === 'status') {
        return a.status.localeCompare(b.status) * sign;
      }
      if (key === 'blockCount') {
        return (a.blockCount - b.blockCount) * sign;
      }
      if (key === 'totalCost') {
        return ((a.totalCost ?? 0) - (b.totalCost ?? 0)) * sign;
      }
      return 0;
    });
  }, [projects, search, sortValue]);

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="プロジェクトの作成・複製・削除・アーカイブ">
        プロジェクト一覧
      </Header>
      <ColumnLayout columns={2} variant="text-grid">
        <FormField label="検索">
          <Input
            disabled={loading}
            value={search}
            onChange={({ detail }) => setSearch(detail.value)}
            placeholder="プロジェクト名でフィルタ…"
            type="search"
          />
        </FormField>
        <FormField label="ソート">
          <Select
            disabled={loading}
            selectedOption={
              SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0]
            }
            onChange={({ detail }) => {
              if (detail.selectedOption?.value) {
                setSortValue(detail.selectedOption.value);
              }
            }}
            options={SORT_OPTIONS}
          />
        </FormField>
      </ColumnLayout>
      {loading ? (
        <Box color="text-body-secondary">読み込み中…</Box>
      ) : (
        <ColumnLayout columns={3} variant="text-grid">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => onOpen(p.id)}
              onDuplicate={() => onDuplicate(p.id)}
              onArchive={() => onArchive(p.id)}
              onDelete={() => onDelete(p.id)}
            />
          ))}
        </ColumnLayout>
      )}
      {!loading && filtered.length === 0 ? (
        <Box color="text-body-secondary" textAlign="center" padding="xl">
          プロジェクトがありません。新規作成してください。
        </Box>
      ) : null}
    </SpaceBetween>
  );
}
