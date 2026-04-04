import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { useSimulation } from '@/hooks/useSimulation';

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type SimulationPanelProps = {
  projectId: string | undefined;
};

export function SimulationPanel({ projectId }: SimulationPanelProps) {
  const { quantity, cost, clash, loading, error, runAll, clear } =
    useSimulation(projectId);

  const exportQuantityCsv = () => {
    if (!quantity) return;
    const lines = ['ifcType,volume,area,length,count'];
    for (const [t, row] of Object.entries(quantity.byType)) {
      lines.push(
        `${t},${String(row.volume)},${String(row.area)},${String(row.length)},${String(row.count)}`,
      );
    }
    lines.push(
      `TOTAL,${String(quantity.total.volume)},${String(quantity.total.area)},,${String(quantity.total.count)}`,
    );
    downloadCsv('quantity.csv', lines.join('\n'));
  };

  const exportCostCsv = () => {
    if (!cost) return;
    const lines = ['ifcType,cost,count'];
    for (const [t, row] of Object.entries(cost.byType)) {
      lines.push(`${t},${String(row.cost)},${String(row.count)}`);
    }
    lines.push(`TOTAL,${String(cost.total)},`);
    if (cost.uncostedBlocks.length) {
      lines.push(`uncostedBlockIds,"${cost.uncostedBlocks.join(';')}"`);
    }
    downloadCsv('cost.csv', lines.join('\n'));
  };

  const exportClashCsv = () => {
    if (!clash) return;
    const lines = ['blockIdA,blockIdB,ix,iy,iz,volume'];
    for (const c of clash.clashes) {
      lines.push(
        `${c.blockIdA},${c.blockIdB},${String(c.intersectionPoint.x)},${String(c.intersectionPoint.y)},${String(c.intersectionPoint.z)},${String(c.intersectionVolume)}`,
      );
    }
    downloadCsv('clash.csv', lines.join('\n'));
  };

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button disabled={!projectId || loading} onClick={() => void runAll()}>
              シミュレーション実行
            </Button>
            <Button disabled={!quantity && !cost && !clash} onClick={() => clear()}>
              結果をクリア
            </Button>
          </SpaceBetween>
        }
      >
        BIM シミュレーション
      </Header>
      {error ? <Box color="text-status-error">{error}</Box> : null}
      {loading ? <Box color="text-body-secondary">実行中…</Box> : null}

      <Header variant="h3">数量算出</Header>
      {quantity ? (
        <SpaceBetween size="s">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={exportQuantityCsv}>数量 CSV エクスポート</Button>
          </SpaceBetween>
          <Table
            trackBy="id"
            columnDefinitions={[
              { id: 't', header: 'IFC タイプ', cell: (r) => r.type },
              { id: 'v', header: '体積 (m³)', cell: (r) => r.volume.toFixed(4) },
              { id: 'a', header: '面積 (m²)', cell: (r) => r.area.toFixed(4) },
              { id: 'l', header: '長さ (m)', cell: (r) => r.length.toFixed(4) },
              { id: 'c', header: '件数', cell: (r) => r.count },
            ]}
            items={Object.entries(quantity.byType).map(([type, row]) => ({
              id: type,
              type,
              ...row,
            }))}
            empty={<Box color="text-body-secondary">データがありません</Box>}
          />
          <Box fontSize="body-s" color="text-body-secondary">
            合計 体積 {quantity.total.volume.toFixed(4)} m³ / 面積{' '}
            {quantity.total.area.toFixed(4)} m² / 件数 {quantity.total.count}
          </Box>
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}

      <Header variant="h3">コスト概算</Header>
      {cost ? (
        <SpaceBetween size="s">
          <Button onClick={exportCostCsv}>コスト CSV エクスポート</Button>
          <Table
            trackBy="id"
            columnDefinitions={[
              { id: 't', header: 'IFC タイプ', cell: (r) => r.type },
              { id: 'co', header: 'コスト', cell: (r) => r.cost.toFixed(0) },
              { id: 'n', header: '件数', cell: (r) => r.count },
            ]}
            items={Object.entries(cost.byType).map(([type, row]) => ({
              id: type,
              type,
              ...row,
            }))}
            empty={<Box color="text-body-secondary">データがありません</Box>}
          />
          <Box fontSize="body-s">
            合計: {cost.total.toFixed(0)} 円（概算）
            {cost.uncostedBlocks.length > 0 ? (
              <Box color="text-status-warning" margin={{ top: 'xs' }}>
                単価未設定ブロック: {cost.uncostedBlocks.length} 件
              </Box>
            ) : null}
          </Box>
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}

      <Header variant="h3">干渉チェック</Header>
      {clash ? (
        <SpaceBetween size="s">
          <Button
            disabled={clash.clashes.length === 0}
            onClick={exportClashCsv}
          >
            干渉 CSV エクスポート
          </Button>
          {clash.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {clash.message}
            </Box>
          ) : null}
          <Table
            trackBy="id"
            columnDefinitions={[
              { id: 'a', header: 'ブロック A', cell: (r) => r.blockIdA },
              { id: 'b', header: 'ブロック B', cell: (r) => r.blockIdB },
              {
                id: 'v',
                header: '干渉体積 (m³)',
                cell: (r) => r.intersectionVolume.toFixed(6),
              },
            ]}
            items={clash.clashes.map((c, i) => ({
              ...c,
              id: `${c.blockIdA}-${c.blockIdB}-${String(i)}`,
            }))}
            empty={
              <Box color="text-body-secondary">干渉は検出されませんでした。</Box>
            }
          />
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}
    </SpaceBetween>
  );
}
