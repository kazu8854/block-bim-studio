import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProject } from '@/api/projects';
import { Canvas3D } from '@/components/canvas/Canvas3D';
import { BlockPalette } from '@/components/palette/BlockPalette';
import { PropertyPanel } from '@/components/properties/PropertyPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const setProject = useProjectStore((s) => s.setProject);
  const project = useProjectStore((s) => s.project);
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId);
  const addBlockFromCatalog = useProjectStore((s) => s.addBlockFromCatalog);

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
    };
  }, [load, setProject]);

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

  const selectedItems = project?.blocks.filter((b) => b.id === selectedBlockId) ?? [];

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup
          items={[
            { text: 'プロジェクト一覧', href: '/' },
            { text: project?.name ?? 'エディタ', href: '#' },
          ]}
          onFollow={(ev) => {
            ev.preventDefault();
            if (ev.detail.href === '/') navigate('/');
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

        <ColumnLayout columns={3} variant="text-grid">
          <SpaceBetween size="m">
            <BlockPalette onSelectBlock={(e) => addBlockFromCatalog(e)} />
          </SpaceBetween>
          <SpaceBetween size="m">
            <Header variant="h2">3D キャンバス</Header>
            <Box fontSize="body-s" color="text-body-secondary">
              ドラッグでオービット、G / R で移動・回転ハンドル。パレットからブロックを
              キャンバスへドラッグ＆ドロップできます。Delete で選択ブロックを削除。
            </Box>
            <Canvas3D />
            <Header variant="h3">配置ブロック一覧</Header>
            <Table
              trackBy="id"
              selectionType="single"
              selectedItems={selectedItems}
              onSelectionChange={({ detail }) => {
                const id = detail.selectedItems[0]?.id;
                selectBlock(id ?? null);
              }}
              columnDefinitions={[
                { id: 'name', header: '名称', cell: (b) => b.name },
                { id: 'type', header: 'IFC', cell: (b) => b.ifcType },
              ]}
              items={project?.blocks ?? []}
              empty={
                <Box color="text-body-secondary" padding="m">
                  ブロックがありません。左のパレットから追加してください。
                </Box>
              }
            />
          </SpaceBetween>
          <PropertyPanel />
        </ColumnLayout>
      </SpaceBetween>
    </Box>
  );
}
