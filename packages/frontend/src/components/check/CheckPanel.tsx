import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import type {
  EnvironmentSimulationResult,
  RegulationCheckResult,
  SafetySimulationResult,
  StructureCheckResult,
} from '@block-bim-studio/shared';
import {
  EnvironmentCheckResponseSchema,
  RegulationCheckResponseSchema,
  SafetyCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { useCallback } from 'react';
import { stripStub } from '@/api/stub';
import { useCheckStore } from '@/stores/checkStore';

const jsonHeaders = { 'Content-Type': 'application/json' };

export type CheckPanelProps = {
  projectId: string | undefined;
};

export function CheckPanel({ projectId }: CheckPanelProps) {
  const structure = useCheckStore((s) => s.structure);
  const regulation = useCheckStore((s) => s.regulation);
  const environment = useCheckStore((s) => s.environment);
  const safety = useCheckStore((s) => s.safety);
  const loading = useCheckStore((s) => s.loading);
  const error = useCheckStore((s) => s.error);
  const setResults = useCheckStore((s) => s.setResults);
  const setLoading = useCheckStore((s) => s.setLoading);
  const setError = useCheckStore((s) => s.setError);
  const clear = useCheckStore((s) => s.clear);

  const runAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const body = JSON.stringify({ projectId });
      const [rs, rr, re, rf] = await Promise.all([
        fetch('/api/check/structure', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/check/regulation', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/check/environment', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/check/safety', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
      ]);
      if (!rs.ok) {
        setError(`構造チェックに失敗 (${String(rs.status)})`);
        return;
      }
      if (!rr.ok) {
        setError(`法規チェックに失敗 (${String(rr.status)})`);
        return;
      }
      if (!re.ok) {
        setError(`環境シミュレーションに失敗 (${String(re.status)})`);
        return;
      }
      if (!rf.ok) {
        setError(`安全管理に失敗 (${String(rf.status)})`);
        return;
      }
      const sj = StructureCheckResponseSchema.parse(await rs.json());
      const rj = RegulationCheckResponseSchema.parse(await rr.json());
      const ej = EnvironmentCheckResponseSchema.parse(await re.json());
      const fj = SafetyCheckResponseSchema.parse(await rf.json());
      setResults({
        structure: stripStub(sj) as StructureCheckResult,
        regulation: stripStub(rj) as RegulationCheckResult,
        environment: stripStub(ej) as EnvironmentSimulationResult,
        safety: stripStub(fj) as SafetySimulationResult,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チェックに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [projectId, setError, setLoading, setResults]);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button disabled={!projectId || loading} onClick={() => void runAll()}>
              建設チェック実行
            </Button>
            <Button
              disabled={!structure && !regulation && !environment && !safety}
              onClick={clear}
            >
              結果をクリア
            </Button>
          </SpaceBetween>
        }
      >
        建設チェック
      </Header>
      {error ? <Box color="text-status-error">{error}</Box> : null}
      {loading ? <Box color="text-body-secondary">実行中…</Box> : null}

      <Header variant="h3">構造チェック</Header>
      {structure ? (
        <SpaceBetween size="s">
          {structure.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {structure.message}
            </Box>
          ) : null}
          <Box fontSize="body-s">
            結果: {structure.passed ? '合格' : '要確認（違反あり）'}
          </Box>
          <Table
            trackBy="key"
            columnDefinitions={[
              { id: 'n', header: 'ブロック', cell: (r) => r.blockName },
              { id: 'r', header: 'ルール', cell: (r) => r.ruleName },
              { id: 'd', header: '内容', cell: (r) => r.description },
              { id: 'rec', header: '推奨', cell: (r) => r.recommendation },
            ]}
            items={structure.violations.map((v, ix) => ({
              ...v,
              key: `${v.blockId}-${String(ix)}`,
            }))}
            empty={
              <Box color="text-body-secondary">違反はありません。</Box>
            }
          />
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}

      <Header variant="h3">法規チェック</Header>
      {regulation ? (
        <SpaceBetween size="s">
          {regulation.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {regulation.message}
            </Box>
          ) : null}
          <Table
            trackBy="name"
            columnDefinitions={[
              { id: 'n', header: '項目', cell: (r) => r.name },
              {
                id: 'c',
                header: '算出値',
                cell: (r) => `${String(r.calculatedValue)} ${r.unit}`,
              },
              {
                id: 'l',
                header: '基準',
                cell: (r) => `${String(r.limitValue)} ${r.unit}`,
              },
              {
                id: 'ok',
                header: '適合',
                cell: (r) => (r.compliant ? 'はい' : 'いいえ'),
              },
              { id: 'desc', header: '説明', cell: (r) => r.description ?? '—' },
            ]}
            items={regulation.items}
            empty={<Box color="text-body-secondary">項目がありません。</Box>}
          />
          <Box fontSize="body-s">
            総合: {regulation.allCompliant ? '適合' : '不適合あり'}
          </Box>
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}

      <Header variant="h3">環境シミュレーション</Header>
      {environment ? (
        <SpaceBetween size="s">
          {environment.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {environment.message}
            </Box>
          ) : null}
          <Box fontSize="body-s">
            窓の年間日射エネルギー合計（概算）: {String(environment.solarGainKwh)}{' '}
            kWh/年 / 外皮 UA 合計（概算）: {String(environment.heatLossKwh)} W/K
          </Box>
          <Box fontWeight="bold" margin={{ top: 's' }}>
            窓別日射
          </Box>
          <Table
            trackBy="blockId"
            columnDefinitions={[
              { id: 'nm', header: '名称', cell: (r) => r.blockName },
              { id: 'f', header: '方位', cell: (r) => r.facing },
              {
                id: 'irr',
                header: '日射 kWh/m²·年',
                cell: (r) => String(r.annualIrradianceKwhM2),
              },
              {
                id: 'e',
                header: '推定 kWh/年',
                cell: (r) => String(r.estimatedSolarKwhYear),
              },
            ]}
            items={environment.windowDetails ?? []}
            empty={<Box color="text-body-secondary">窓データなし</Box>}
          />
          <Box fontWeight="bold" margin={{ top: 's' }}>
            外皮熱損失（U×A）
          </Box>
          <Table
            trackBy="blockId"
            columnDefinitions={[
              { id: 'nm', header: '名称', cell: (r) => r.blockName },
              { id: 't', header: 'IFC', cell: (r) => r.ifcType },
              { id: 'a', header: '面積 m²', cell: (r) => String(r.grossAreaM2) },
              { id: 'u', header: 'U 値', cell: (r) => String(r.uValueWm2K) },
              { id: 'q', header: 'W/K', cell: (r) => String(r.heatLossWK) },
            ]}
            items={environment.envelopeDetails ?? []}
            empty={<Box color="text-body-secondary">外皮データなし</Box>}
          />
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}

      <Header variant="h3">安全管理</Header>
      {safety ? (
        <SpaceBetween size="s">
          {safety.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {safety.message}
            </Box>
          ) : null}
          <Box fontSize="body-s">
            結果: {safety.passed ? '顕在リスクなし（簡易）' : '要注意'}
          </Box>
          <Table
            trackBy="id"
            columnDefinitions={[
              { id: 'k', header: '種類', cell: (r) => r.kind },
              { id: 'd', header: '内容', cell: (r) => r.description },
              {
                id: 'bn',
                header: 'ブロック',
                cell: (r) => r.blockNames.join(', '),
              },
              { id: 'p', header: '工程期間', cell: (r) => r.periodDescription },
              {
                id: 'rk',
                header: 'リスク',
                cell: (r) => r.riskLevel,
              },
            ]}
            items={safety.hazards}
            empty={<Box color="text-body-secondary">危険箇所は検出されませんでした。</Box>}
          />
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">実行すると結果が表示されます。</Box>
      )}
    </SpaceBetween>
  );
}
