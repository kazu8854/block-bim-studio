import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { useRef, useState } from 'react';
import {
  downloadIfcFile,
  exportIfc,
  importIfc,
  readFileAsBase64,
} from '@/api/ifc';
import { updateProject } from '@/api/projects';
import type { Block, Project } from '@block-bim-studio/shared';
import { useProjectStore } from '@/stores/projectStore';

function mergeImportedBlocks(existing: Block[], imported: Block[]): Block[] {
  const ids = new Set(existing.map((b) => b.id));
  const next = imported.map((b) =>
    ids.has(b.id) ? { ...b, id: crypto.randomUUID() } : b,
  );
  return [...existing, ...next];
}

export function IfcToolbar({ project }: { project: Project }) {
  const setProject = useProjectStore((s) => s.setProject);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlocks, setPreviewBlocks] = useState<Block[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await exportIfc(project.id);
      downloadIfcFile(r.filename, r.ifcBase64);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'エクスポートに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const b64 = await readFileAsBase64(f);
      const r = await importIfc(b64);
      setPreviewBlocks(r.blocks);
      setPreviewWarnings(r.warnings);
      setPreviewOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    setBusy(true);
    setErr(null);
    try {
      const merged = mergeImportedBlocks(project.blocks, previewBlocks);
      const next = await updateProject({ ...project, blocks: merged });
      setProject(next);
      setPreviewOpen(false);
      setPreviewBlocks([]);
      setPreviewWarnings([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SpaceBetween direction="horizontal" size="xs">
        <Button disabled={busy} onClick={() => void onExport()}>
          IFC エクスポート
        </Button>
        <Button disabled={busy} onClick={onPickFile}>
          IFC インポート
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".ifc,.IFC"
          style={{ display: 'none' }}
          onChange={(e) => void onFile(e.target.files)}
        />
      </SpaceBetween>
      {err ? (
        <Box color="text-status-error" margin={{ top: 'xs' }} fontSize="body-s">
          {err}
        </Box>
      ) : null}

      <Modal
        visible={previewOpen}
        onDismiss={() => !busy && setPreviewOpen(false)}
        header="IFC インポートの確認"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" disabled={busy} onClick={() => setPreviewOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="primary"
                disabled={busy || previewBlocks.length === 0}
                onClick={() => void confirmImport()}
              >
                現在のプロジェクトに追加
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box>
            読み込みブロック数: <strong>{previewBlocks.length}</strong>
          </Box>
          {previewWarnings.length > 0 ? (
            <FormField label="警告">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {previewWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </FormField>
          ) : null}
          {previewBlocks.length === 0 ? (
            <Box color="text-body-secondary">
              取り込めるブロックがありません。ファイル形式を確認してください。
            </Box>
          ) : null}
        </SpaceBetween>
      </Modal>
    </>
  );
}
