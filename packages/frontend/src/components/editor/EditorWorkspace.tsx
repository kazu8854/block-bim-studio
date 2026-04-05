import Box from '@cloudscape-design/components/box';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import type { CSSProperties } from 'react';
import { Canvas3D } from '@/components/canvas/Canvas3D';
import { BlockPalette } from '@/components/palette/BlockPalette';
import { AIPanel } from '@/components/ai/AIPanel';
import { IfcToolbar } from '@/components/editor/IfcToolbar';
import { PropertyPanel } from '@/components/properties/PropertyPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

const workspaceGrid: CSSProperties = {
  display: 'grid',
  width: '100%',
  gap: 'clamp(16px, 2vw, 28px)',
  alignItems: 'start',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
};

/**
 * エディタのレスポンシブグリッド（パレット・3D＋一覧・属性）。
 */
export function EditorWorkspace() {
  const project = useProjectStore((s) => s.project);
  const projectId = project?.id;
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId);
  const addBlockFromCatalog = useProjectStore((s) => s.addBlockFromCatalog);

  const selectedItems = project?.blocks.filter((b) => b.id === selectedBlockId) ?? [];

  return (
    <div style={workspaceGrid}>
      <SpaceBetween size="m">
        <BlockPalette onSelectBlock={(e) => addBlockFromCatalog(e)} />
      </SpaceBetween>
      <SpaceBetween size="m">
        <Header variant="h2">3D キャンバス</Header>
        <Box fontSize="body-s" color="text-body-secondary">
          ドラッグでオービット、<strong>G</strong> / <strong>R</strong> で移動・回転ハンドル（移動は
          0.1m グリッド、回転は 15° ステップ）。パレットからブロックをキャンバスへドラッグ＆ドロップできます。
          近接ブロックへの面スナップはドラッグ中もガイド表示されます。Delete
          で選択ブロックを削除。
        </Box>
        {project ? <IfcToolbar project={project} /> : null}
        <Canvas3D />
        <Header variant="h3">配置ブロック一覧</Header>
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
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
        </div>
      </SpaceBetween>
      <SpaceBetween size="m">
        <PropertyPanel />
        {projectId ? <AIPanel projectId={projectId} /> : null}
      </SpaceBetween>
    </div>
  );
}
