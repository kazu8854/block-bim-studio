import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getDashboardData } from '@/api/dashboard';
import { listProjects } from '@/api/projects';
import { Dashboard } from '@/components/dashboard/Dashboard';
import type { DashboardData } from '@block-bim-studio/shared';

function DashboardHub() {
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
        <Header variant="h1" description="プロジェクトを選ぶと材料・コスト・進捗のグラフを表示します。">
          ダッシュボード
        </Header>
        {error ? <Box color="text-status-error">{error}</Box> : null}
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => void load()} disabled={loading}>
            再読み込み
          </Button>
          <Button onClick={() => navigate('/compare')}>プロジェクト比較へ</Button>
        </SpaceBetween>
        <Header variant="h2">プロジェクトを選択</Header>
        <Table
          trackBy="id"
          loading={loading}
          columnDefinitions={[
            { id: 'name', header: '名前', cell: (p) => p.name },
            { id: 'blocks', header: 'ブロック数', cell: (p) => p.blockCount },
            {
              id: 'dash',
              header: '分析',
              cell: (p) => <Link to={`/dashboard/${p.id}`}>開く</Link>,
            },
            {
              id: 'editor',
              header: '',
              cell: (p) => <Link to={`/editor/${p.id}`}>エディタ</Link>,
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

function ProjectDashboard({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardData(projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup
          items={[
            { text: 'ダッシュボード', href: '/dashboard' },
            { text: 'プロジェクト分析', href: '#' },
          ]}
          onFollow={(ev) => {
            ev.preventDefault();
            if (ev.detail.href === '/dashboard') navigate('/dashboard');
          }}
        />
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate(`/editor/${projectId}`)}>
                エディタへ
              </Button>
              <Button onClick={() => navigate('/dashboard')}>一覧へ</Button>
            </SpaceBetween>
          }
        >
          プロジェクト分析
        </Header>
        {error ? <Box color="text-status-error">{error}</Box> : null}
        {loading || !data ? (
          <Box color="text-body-secondary">読み込み中…</Box>
        ) : (
          <Dashboard data={data} onRefresh={() => void load()} />
        )}
      </SpaceBetween>
    </Box>
  );
}

export function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  if (projectId) return <ProjectDashboard projectId={projectId} />;
  return <DashboardHub />;
}
