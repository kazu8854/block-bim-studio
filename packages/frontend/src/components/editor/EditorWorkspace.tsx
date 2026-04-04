import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import { Canvas3D } from '@/components/canvas/Canvas3D';
import { BlockPalette } from '@/components/palette/BlockPalette';
import { IfcToolbar } from '@/components/editor/IfcToolbar';
import { PropertyPanel } from '@/components/properties/PropertyPanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

/**
 * エディタの 3 カラム（パレット・3D＋一覧・属性）をまとめたワークスペース。
 */
export function EditorWorkspace() {
  const project = useProjectStore((s) => s.project);
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId);
  const addBlockFromCatalog = useProjectStore((s) => s.addBlockFromCatalog);

  const selectedItems = project?.blocks.filter((b) => b.id === selectedBlockId) ?? [];

  return (
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
        {project ? <IfcToolbar project={project} /> : null}
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
  );
}
