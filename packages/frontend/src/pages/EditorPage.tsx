import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProject } from '@/api/projects';
import { EditorWorkspace } from '@/components/editor/EditorWorkspace';
import { CheckPanel } from '@/components/check/CheckPanel';
import { SchedulePanel } from '@/components/schedule/SchedulePanel';
import { SimulationPanel } from '@/components/simulation/SimulationPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const setProject = useProjectStore((s) => s.setProject);
  const project = useProjectStore((s) => s.project);
  const clearSnapGuides = useCanvasStore((s) => s.clearSnapGuides);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoadError(null);
    try {
      const p = await getProject(projectId);
      if (!p) {
        setLoadError('プロジェクトが見つかりません');
        setProject(null);
        return;
      }
      setProject(p);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '読み込みに失敗しました');
      setProject(null);
    }
  }, [projectId, setProject]);

  useEffect(() => {
    void load();
    return () => {
      setProject(null);
      clearSnapGuides();
    };
  }, [load, setProject, clearSnapGuides]);

  const save = async () => {
    if (!project) return;
    setSaving(true);
    setSaveError(null);
    try {
      const next = await updateProject(project);
      setProject(next);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup
          items={[
            { text: 'プロジェクト一覧', href: '/' },
            {
              text: 'ダッシュボード',
              href: projectId ? `/dashboard/${projectId}` : '/dashboard',
            },
            { text: project?.name ?? 'エディタ', href: '#' },
          ]}
          onFollow={(ev) => {
            ev.preventDefault();
            if (ev.detail.href === '/') navigate('/');
            if (ev.detail.href.startsWith('/dashboard')) navigate(ev.detail.href);
          }}
        />
        {loadError ? (
          <Alert type="error" header="読み込みエラー">
            {loadError}{' '}
            <Link to="/">一覧へ戻る</Link>
          </Alert>
        ) : null}
        {saveError ? (
          <Alert type="error" dismissible onDismiss={() => setSaveError(null)}>
            {saveError}
          </Alert>
        ) : null}

        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() =>
                  projectId ? navigate(`/dashboard/${projectId}`) : navigate('/dashboard')
                }
              >
                ダッシュボード
              </Button>
              <Button onClick={() => navigate('/')}>一覧へ</Button>
              <Button
                variant="primary"
                disabled={!project || saving}
                onClick={() => void save()}
              >
                保存
              </Button>
            </SpaceBetween>
          }
        >
          {project?.name ?? 'エディタ'}
        </Header>

        {project ? <EditorWorkspace /> : null}
        {project ? <CheckPanel projectId={project.id} /> : null}
        {project ? <SchedulePanel projectId={project.id} /> : null}
        {project ? <SimulationPanel projectId={project.id} /> : null}
      </SpaceBetween>
    </Box>
  );
}
