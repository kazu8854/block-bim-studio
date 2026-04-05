import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import BreadcrumbGroup from '@cloudscape-design/components/breadcrumb-group';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { ProjectMetadata } from '@block-bim-studio/shared';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createProject,
  deleteProject,
  duplicateProject,
  listProjects,
  setProjectStatus as apiArchive,
} from '@/api/projects';
import { ProjectList } from '@/components/project/ProjectList';

export function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Awaited<ReturnType<typeof listProjects>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [siteArea, setSiteArea] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listProjects();
      setProjects(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitCreate = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    let metadata: ProjectMetadata | undefined;
    const sa = siteArea.trim();
    if (sa !== '') {
      const n = Number(sa);
      if (Number.isNaN(n) || n <= 0) {
        setError('敷地面積は正の数値で入力してください');
        return;
      }
      metadata = { siteArea: n };
    }
    setCreating(true);
    setError(null);
    try {
      const p = await createProject({ name, metadata });
      setCreateOpen(false);
      setNewName('');
      setSiteArea('');
      // 一覧の再取得に失敗してもエディタへ遷移できるように先に遷移する
      navigate(`/editor/${p.id}`);
      void refresh().catch((err) => {
        console.error('プロジェクト一覧の再取得に失敗しました', err);
        setError(
          err instanceof Error
            ? err.message
            : '一覧の更新に失敗しました（エディタは開いています）',
        );
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProject(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '複製に失敗しました');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiArchive(id, 'archived');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アーカイブに失敗しました');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId);
      setDeleteId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
    }
  };

  return (
    <Box padding={{ horizontal: 'l', vertical: 'l' }}>
      <SpaceBetween size="l">
        <BreadcrumbGroup
          items={[{ text: 'Block BIM Studio', href: '/' }]}
          onFollow={(ev) => {
            ev.preventDefault();
            navigate('/');
          }}
        />
        {error ? (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        <Box float="right">
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            新規プロジェクト
          </Button>
        </Box>
        <ProjectList
          projects={projects}
          loading={loading}
          onOpen={(id) => navigate(`/editor/${id}`)}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={(id) => setDeleteId(id)}
        />
      </SpaceBetween>

      <Modal
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        header="新規プロジェクト"
        closeAriaLabel="閉じる"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setCreateOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="primary"
                disabled={!newName.trim() || creating}
                loading={creating}
                onClick={() => void submitCreate()}
              >
                作成
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="プロジェクト名">
            <Input
              value={newName}
              onChange={({ detail }) => setNewName(detail.value)}
            />
          </FormField>
          <FormField label="敷地面積 (m²) — 任意">
            <Input
              value={siteArea}
              onChange={({ detail }) => setSiteArea(detail.value)}
              type="number"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteId !== null}
        onDismiss={() => setDeleteId(null)}
        header="プロジェクトを削除"
        closeAriaLabel="閉じる"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteId(null)}>
                キャンセル
              </Button>
              <Button variant="primary" onClick={() => void confirmDelete()}>
                削除する
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        この操作は取り消せません。削除してよろしいですか？
      </Modal>
    </Box>
  );
}
