import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProjects } from '@/api/projects';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProjects>>>([]);

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

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup items={[{ text: 'ダッシュボード', href: '#' }]} />
        <Header variant="h1" description="直近のプロジェクトへ移動できます。">
          ダッシュボード
        </Header>
        {error ? (
          <Box color="text-status-error">{error}</Box>
        ) : null}
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => void load()} disabled={loading}>
            再読み込み
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            プロジェクト一覧へ
          </Button>
        </SpaceBetween>
        <Header variant="h2">プロジェクト概要</Header>
        <Table
          trackBy="id"
          loading={loading}
          loadingText="読み込み中"
          columnDefinitions={[
            { id: 'name', header: '名前', cell: (p) => p.name },
            { id: 'status', header: 'ステータス', cell: (p) => p.status },
            { id: 'blocks', header: 'ブロック数', cell: (p) => p.blockCount },
            {
              id: 'updated',
              header: '更新日時',
              cell: (p) => new Date(p.updatedAt).toLocaleString('ja-JP'),
            },
            {
              id: 'open',
              header: '',
              cell: (p) => (
                <Link to={`/editor/${p.id}`}>エディタを開く</Link>
              ),
            },
          ]}
          items={rows}
          empty={
            <Box color="text-body-secondary" padding="m">
              プロジェクトがありません。{' '}
              <Link to="/">一覧で新規作成</Link>してください。
            </Box>
          }
        />
      </SpaceBetween>
    </Box>
  );
}
