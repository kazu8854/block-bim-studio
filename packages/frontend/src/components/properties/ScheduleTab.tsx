import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import type {
  Dependency,
  DependencyType,
  ProgressStatus,
  ScheduleInfo,
} from '@block-bim-studio/shared';
import {
  computeEndDateFromStartAndDuration,
  validateProjectSchedules,
} from '@block-bim-studio/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';

const DEP_TYPES: { label: string; value: DependencyType }[] = [
  { label: 'FS（終了→開始）', value: 'FS' },
  { label: 'SS（開始→開始）', value: 'SS' },
  { label: 'FF（終了→終了）', value: 'FF' },
  { label: 'SF（開始→終了）', value: 'SF' },
];

const STATUS_OPTIONS: { label: string; value: ProgressStatus }[] = [
  { label: '未着手', value: 'not_started' },
  { label: '進行中', value: 'in_progress' },
  { label: '完了', value: 'completed' },
];

function isoDateToInput(iso: string): string {
  return iso.slice(0, 10);
}

function inputDateToIsoUtc(d: string): string {
  return `${d}T00:00:00.000Z`;
}

function defaultSchedule(blockId: string): ScheduleInfo {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const startDate = start.toISOString();
  const durationDays = 1;
  return {
    blockId,
    startDate,
    endDate: computeEndDateFromStartAndDuration(startDate, durationDays),
    durationDays,
    dependencies: [],
    status: 'not_started',
  };
}

export type ScheduleTabProps = {
  blockId: string;
};

export function ScheduleTab({ blockId }: ScheduleTabProps) {
  const project = useProjectStore((s) => s.project);
  const upsertSchedule = useProjectStore((s) => s.upsertSchedule);
  const removeScheduleForBlock = useProjectStore((s) => s.removeScheduleForBlock);

  const [draft, setDraft] = useState<ScheduleInfo>(() => defaultSchedule(blockId));

  useEffect(() => {
    const existing = project?.schedules.find((s) => s.blockId === blockId);
    setDraft(existing ? { ...existing } : defaultSchedule(blockId));
  }, [blockId, project?.schedules]);

  const otherBlocks = useMemo(() => {
    if (!project) return [];
    return project.blocks.filter((b) => b.id !== blockId);
  }, [project, blockId]);

  const depOptions = useMemo(
    () =>
      otherBlocks.map((b) => ({
        label: b.name,
        value: b.id,
      })),
    [otherBlocks],
  );

  const validationMessages = useMemo(() => {
    if (!project) return [];
    const rest = project.schedules.filter((s) => s.blockId !== blockId);
    const nextProject = { ...project, schedules: [...rest, draft] };
    return validateProjectSchedules(nextProject);
  }, [project, draft, blockId]);

  const setStartFromInput = (ymd: string) => {
    const startDate = inputDateToIsoUtc(ymd);
    setDraft((prev) => {
      const durationDays = prev.durationDays;
      return {
        ...prev,
        startDate,
        endDate: computeEndDateFromStartAndDuration(startDate, durationDays),
      };
    });
  };

  const setDuration = (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return;
    setDraft((prev) => ({
      ...prev,
      durationDays: n,
      endDate: computeEndDateFromStartAndDuration(prev.startDate, n),
    }));
  };

  const addDependency = () => {
    const first = otherBlocks[0];
    if (!first) return;
    setDraft((prev) => ({
      ...prev,
      dependencies: [...prev.dependencies, { blockId: first.id, type: 'FS' }],
    }));
  };

  const updateDep = (index: number, next: Dependency) => {
    setDraft((prev) => ({
      ...prev,
      dependencies: prev.dependencies.map((d, i) => (i === index ? next : d)),
    }));
  };

  const removeDep = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      dependencies: prev.dependencies.filter((_, i) => i !== index),
    }));
  };

  const save = useCallback(() => {
    if (validationMessages.length) return;
    upsertSchedule(draft);
  }, [draft, upsertSchedule, validationMessages.length]);

  const clear = useCallback(() => {
    removeScheduleForBlock(blockId);
    setDraft(defaultSchedule(blockId));
  }, [blockId, removeScheduleForBlock]);

  if (!project) return null;

  return (
    <SpaceBetween size="m">
      <Header variant="h3">工程情報</Header>
      {otherBlocks.length === 0 ? (
        <Alert type="info">
          先行ブロックを指定するには、他のブロックを1つ以上配置してください。
        </Alert>
      ) : null}

      {validationMessages.length > 0 ? (
        <Alert type="error" header="検証エラー">
          <SpaceBetween size="xs">
            {validationMessages.map((m) => (
              <Box key={m}>{m}</Box>
            ))}
          </SpaceBetween>
        </Alert>
      ) : null}

      <FormField label="開始日 (UTC)">
        <input
          type="date"
          value={isoDateToInput(draft.startDate)}
          onChange={(e) => setStartFromInput(e.target.value)}
          aria-label="開始日"
        />
      </FormField>
      <FormField label="工期（日）">
        <Input
          type="number"
          value={String(draft.durationDays)}
          onChange={({ detail }) => setDuration(detail.value)}
        />
      </FormField>
      <FormField label="終了日（自動）">
        <Box color="text-body-secondary">{draft.endDate}</Box>
      </FormField>
      <FormField label="進捗">
        <Select
          selectedOption={
            STATUS_OPTIONS.find((o) => o.value === draft.status) ?? null
          }
          onChange={({ detail }) => {
            const v = detail.selectedOption?.value;
            if (!v) return;
            setDraft((p) => ({
              ...p,
              status: v as ProgressStatus,
            }));
          }}
          options={STATUS_OPTIONS}
        />
      </FormField>

      <Header variant="h3" actions={<Button onClick={addDependency}>先行を追加</Button>}>
        依存関係
      </Header>
      <Table
        trackBy="ix"
        columnDefinitions={[
          {
            id: 'pred',
            header: '先行ブロック',
            cell: (item) => (
              <Select
                selectedOption={
                  depOptions.find((o) => o.value === item.dep.blockId) ?? null
                }
                onChange={({ detail }) => {
                  const v = detail.selectedOption?.value;
                  if (!v) return;
                  updateDep(item.ix, { ...item.dep, blockId: v });
                }}
                options={depOptions}
              />
            ),
          },
          {
            id: 'type',
            header: 'タイプ',
            cell: (item) => (
              <Select
                selectedOption={
                  DEP_TYPES.find((o) => o.value === item.dep.type) ?? null
                }
                onChange={({ detail }) => {
                  const v = detail.selectedOption?.value;
                  if (!v) return;
                  updateDep(item.ix, { ...item.dep, type: v as DependencyType });
                }}
                options={DEP_TYPES}
              />
            ),
          },
          {
            id: 'rm',
            header: '',
            width: 100,
            cell: (item) => (
              <Button variant="link" onClick={() => removeDep(item.ix)}>
                削除
              </Button>
            ),
          },
        ]}
        items={draft.dependencies.map((dep, ix) => ({ ix, dep }))}
        empty={
          <Box color="text-body-secondary" padding="s">
            依存がありません
          </Box>
        }
      />

      <SpaceBetween direction="horizontal" size="xs">
        <Button
          variant="primary"
          disabled={validationMessages.length > 0}
          onClick={save}
        >
          工程を保存
        </Button>
        <Button onClick={clear}>工程を削除</Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
