import type {
  CompareMetricDelta,
  ProjectCompareResult,
} from '@block-bim-studio/shared';
import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { compareProjects } from '@/api/compare';
import { listProjects } from '@/api/projects';

const CompareCharts = lazy(async () => {
  const m = await import('@/pages/CompareCharts');
  return { default: m.CompareCharts };
});

function resultToCsv(r: ProjectCompareResult): string {
  const header = ['metric', ...r.projects.map((p) => p.name)];
  const lines = [header.join(',')];
  for (const d of r.deltas) {
    const row = [
      d.metric,
      ...r.projects.map((p) => String(d.valuesByProjectId[p.id] ?? '')),
    ];
    lines.push(row.map((c) => `"${c.replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

export function ComparePage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProjects>>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmpLoading, setCmpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectCompareResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listProjects());
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runCompare = async () => {
    setCmpLoading(true);
    setError(null);
    try {
      const res = await compareProjects(selected);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '比較に失敗しました');
    } finally {
      setCmpLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!result || result.deltas.length === 0) return [];
    const cost = result.deltas.find((d) => d.metric === 'totalCostEstimate');
    if (!cost) return [];
    return result.projects.map((p) => ({
      name: p.name.slice(0, 12),
      cost: cost.valuesByProjectId[p.id] ?? 0,
    }));
  }, [result]);

  const downloadCsv = () => {
    if (!result) return;
    const blob = new Blob([resultToCsv(result)], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-compare.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup
          items={[
            { text: 'プロジェクト一覧', href: '/' },
            { text: 'プロジェクト比較', href: '#' },
          ]}
        />
        <Header variant="h1" description="2件以上のプロジェクトを選んで主要指標を並べます。">
          プロジェクト比較
        </Header>
        {error ? <Box color="text-status-error">{error}</Box> : null}

        <Header variant="h2">比較対象の選択</Header>
        <Table
          trackBy="id"
          selectedItems={rows.filter((p) => selected.includes(p.id))}
          onSelectionChange={({ detail }) => {
            setSelected(detail.selectedItems.map((p) => p.id));
          }}
          selectionType="multi"
          loading={loading}
          columnDefinitions={[
            { id: 'name', header: '名前', cell: (p) => p.name },
            { id: 'blocks', header: 'ブロック数', cell: (p) => p.blockCount },
            {
              id: 'open',
              header: '',
              cell: (p) => <Link to={`/editor/${p.id}`}>エディタ</Link>,
            },
          ]}
          items={rows}
          empty={<Box color="text-body-secondary">プロジェクトがありません。</Box>}
        />

        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="primary"
            disabled={selected.length < 2 || cmpLoading}
            onClick={() => void runCompare()}
          >
            比較を実行
          </Button>
          <Button disabled={!result} onClick={downloadCsv}>
            CSV エクスポート
          </Button>
        </SpaceBetween>

        {result?.message ? (
          <Box color="text-status-warning">{result.message}</Box>
        ) : null}

        {result && !result.message && result.projects.length >= 2 ? (
          <SpaceBetween size="l">
            <Header variant="h2">コスト概算の比較</Header>
            <Suspense
              fallback={
                <Box color="text-body-secondary" padding="m">
                  グラフを読み込み中…
                </Box>
              }
            >
              <CompareCharts chartData={chartData} />
            </Suspense>

            <Header variant="h2">指標テーブル</Header>
            <Table<CompareMetricDelta>
              trackBy="metric"
              columnDefinitions={[
                { id: 'metric', header: '指標', cell: (d) => d.metric },
                ...result.projects.map((p) => ({
                  id: p.id,
                  header: p.name,
                  cell: (d: CompareMetricDelta) =>
                    new Intl.NumberFormat('ja-JP', {
                      maximumFractionDigits: 2,
                    }).format(d.valuesByProjectId[p.id] ?? 0),
                })),
              ]}
              items={result.deltas}
            />
          </SpaceBetween>
        ) : null}
      </SpaceBetween>
    </Box>
  );
}
