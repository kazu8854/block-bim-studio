import type { DashboardData } from '@block-bim-studio/shared';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { lazy, Suspense, useCallback, useRef } from 'react';

const DashboardCharts = lazy(async () => {
  const m = await import('@/components/dashboard/DashboardCharts');
  return { default: m.DashboardCharts };
});

export type DashboardProps = {
  data: DashboardData;
  onRefresh?: () => void;
};

function materialChartRows(q: Record<string, number>) {
  return Object.entries(q).map(([name, value]) => ({ name, value }));
}

function costChartRows(c: Record<string, number>) {
  return Object.entries(c).map(([name, value]) => ({ name, value }));
}

export function Dashboard({ data, onRefresh }: DashboardProps) {
  const exportRootRef = useRef<HTMLDivElement>(null);

  const exportPng = useCallback(async () => {
    const el = exportRootRef.current;
    if (!el) return;
    const htmlToImage = await import('html-to-image');
    const dataUrl = await htmlToImage.toPng(el, { pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `dashboard-${data.projectId}.png`;
    a.click();
  }, [data.projectId]);

  const exportPdf = useCallback(async () => {
    const el = exportRootRef.current;
    if (!el) return;
    const [htmlToImage, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);
    const dataUrl = await htmlToImage.toPng(el, { pixelRatio: 2 });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
    pdf.save(`dashboard-${data.projectId}.pdf`);
  }, [data.projectId]);

  if (data.blockCount === 0) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">プロジェクト分析</Header>
        <Box color="text-body-secondary">
          ブロックが配置されていません。エディタでブロックを追加すると、材料別数量・コスト・進捗が表示されます。
        </Box>
        {onRefresh ? (
          <Button onClick={() => onRefresh()}>再読み込み</Button>
        ) : null}
      </SpaceBetween>
    );
  }

  const matRows = materialChartRows(data.quantityByType);
  const costRows = costChartRows(data.costByIfcType);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            {onRefresh ? (
              <Button onClick={() => onRefresh()}>再計算</Button>
            ) : null}
            <Button onClick={() => void exportPng()}>PNG エクスポート</Button>
            <Button onClick={() => void exportPdf()}>PDF エクスポート</Button>
          </SpaceBetween>
        }
      >
        プロジェクト分析
      </Header>

      <div ref={exportRootRef} style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <SpaceBetween size="l">
          <Box>
            <Box variant="h3" margin={{ bottom: 's' }}>
              工程進捗（完了ブロック数 ÷ 全ブロック数）
            </Box>
            <ProgressBar
              value={data.scheduleProgressPercent}
              label={`${String(data.scheduleProgressPercent)}%`}
              description="工程テーブルでステータスを完了にすると進みます。"
            />
          </Box>

          {data.totalCostEstimate != null ? (
            <Box fontSize="heading-m">
              コスト概算合計:{' '}
              <strong>
                {new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: 'JPY',
                  maximumFractionDigits: 0,
                }).format(data.totalCostEstimate)}
              </strong>
            </Box>
          ) : null}

          <Suspense
            fallback={
              <Box color="text-body-secondary" padding="m">
                グラフを読み込み中…
              </Box>
            }
          >
            <DashboardCharts matRows={matRows} costRows={costRows} />
          </Suspense>
        </SpaceBetween>
      </div>
    </SpaceBetween>
  );
}
