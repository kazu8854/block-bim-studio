import type { Block, StructureSuggestion } from '@block-bim-studio/shared';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import Tabs from '@cloudscape-design/components/tabs';
import { useCallback, useRef, useState } from 'react';
import {
  AI_TEXT_MAX_CHARS,
  generateFromImage,
  generateFromText,
  mergeBlocksAvoidingIds,
  readFileAsBase64,
  suggestStructure,
  validateImageFile,
} from '@/api/ai';
import { updateProject } from '@/api/projects';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

type ImageRow = {
  rowId: string;
  block: Block;
  confidence: number;
  excluded: boolean;
};
type SuggestRow = StructureSuggestion & { _rowId: number };

export function AIPanel({ projectId }: { projectId: string }) {
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const setAiPreview = useCanvasStore((s) => s.setAiPreviewBlocks);
  const clearAiPreview = useCanvasStore((s) => s.clearAiPreviewBlocks);

  const [tab, setTab] = useState('structure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<StructureSuggestion[]>([]);
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);
  const [selectedSuggestIdx, setSelectedSuggestIdx] = useState<number | null>(
    null,
  );

  const [nlText, setNlText] = useState('');
  const [nlPreview, setNlPreview] = useState<Block[] | null>(null);

  const [imageRows, setImageRows] = useState<ImageRow[] | null>(null);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = useCallback(
    async (next: NonNullable<typeof project>) => {
      const saved = await updateProject(next);
      setProject(saved);
    },
    [setProject],
  );

  const runSuggest = async () => {
    setLoading(true);
    setError(null);
    setSuggestMessage(null);
    setSuggestions([]);
    setSelectedSuggestIdx(null);
    clearAiPreview();
    try {
      const r = await suggestStructure(projectId);
      setSuggestions(r.suggestions);
      setSuggestMessage(r.message ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '構造提案に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (idx: number) => {
    setSelectedSuggestIdx(idx);
    const s = suggestions[idx];
    if (s) setAiPreview(s.suggestedBlocks);
    else clearAiPreview();
  };

  const applySuggestion = async () => {
    if (selectedSuggestIdx === null || !project) return;
    const s = suggestions[selectedSuggestIdx];
    if (!s) return;
    const merged = mergeBlocksAvoidingIds(project.blocks, s.suggestedBlocks);
    await persist({
      ...project,
      blocks: [...project.blocks, ...merged],
    });
    clearAiPreview();
    setSuggestions([]);
    setSelectedSuggestIdx(null);
  };

  const rejectSuggestion = () => {
    clearAiPreview();
    setSelectedSuggestIdx(null);
  };

  const runNl = async () => {
    const t = nlText.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    setNlPreview(null);
    try {
      const r = await generateFromText(t);
      setNlPreview(r.blocks);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const confirmNl = async () => {
    if (!nlPreview?.length || !project) return;
    const merged = mergeBlocksAvoidingIds(project.blocks, nlPreview);
    await persist({
      ...project,
      blocks: [...project.blocks, ...merged],
    });
    setNlPreview(null);
    setNlText('');
  };

  const onPickImage = () => fileRef.current?.click();

  const onImageFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const verr = validateImageFile(f);
    if (verr) {
      setError(verr);
      return;
    }
    setLoading(true);
    setError(null);
    setImageRows(null);
    setImageNote(null);
    try {
      const b64 = await readFileAsBase64(f);
      const r = await generateFromImage(b64);
      setImageRows(
        r.detectedElements.map((d) => ({
          rowId: crypto.randomUUID(),
          block: d.block,
          confidence: d.confidence,
          excluded: false,
        })),
      );
      if (r.message) {
        if (r.detectedElements.length === 0) setError(r.message);
        else setImageNote(r.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像解析に失敗しました');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleImageExclude = (rowId: string) => {
    setImageRows((rows) =>
      rows
        ? rows.map((r) =>
            r.rowId === rowId ? { ...r, excluded: !r.excluded } : r,
          )
        : null,
    );
  };

  const confirmImage = async () => {
    if (!imageRows?.length || !project) return;
    const take = imageRows.filter((r) => !r.excluded).map((r) => r.block);
    if (!take.length) return;
    const merged = mergeBlocksAvoidingIds(project.blocks, take);
    await persist({
      ...project,
      blocks: [...project.blocks, ...merged],
    });
    setImageRows(null);
    setImageNote(null);
  };

  return (
    <SpaceBetween size="m">
      <Header variant="h2">AI アシスタント</Header>
      {error ? (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Tabs
        activeTabId={tab}
        onChange={({ detail }) => setTab(detail.activeTabId)}
        tabs={[
          {
            id: 'structure',
            label: '構造提案',
            content: (
              <SpaceBetween size="m">
                <Box fontSize="body-s" color="text-body-secondary">
                  ブロックが3個以上あるとき、改善案を取得できます。一覧から選ぶとシーンに半透明プレビューが出ます。
                </Box>
                <Button disabled={loading} onClick={() => void runSuggest()}>
                  提案を取得
                </Button>
                {suggestMessage ? (
                  <Alert type="info">{suggestMessage}</Alert>
                ) : null}
                <Table<SuggestRow>
                  trackBy="_rowId"
                  selectionType="single"
                  selectedItems={
                    selectedSuggestIdx !== null && suggestions[selectedSuggestIdx]
                      ? [
                          {
                            ...suggestions[selectedSuggestIdx]!,
                            _rowId: selectedSuggestIdx,
                          },
                        ]
                      : []
                  }
                  onSelectionChange={({ detail }) => {
                    const item = detail.selectedItems[0];
                    if (item) selectSuggestion(item._rowId);
                    else {
                      setSelectedSuggestIdx(null);
                      clearAiPreview();
                    }
                  }}
                  columnDefinitions={[
                    {
                      id: 'p',
                      header: '優先度',
                      cell: (s) => s.priority,
                    },
                    {
                      id: 'd',
                      header: '提案',
                      cell: (s) => s.description,
                    },
                    {
                      id: 'r',
                      header: '理由',
                      cell: (s) => s.reason,
                    },
                  ]}
                  items={suggestions.map((s, i) => ({ ...s, _rowId: i }))}
                  empty={<Box color="text-body-secondary">提案がありません。</Box>}
                />
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={selectedSuggestIdx === null || loading}
                    variant="primary"
                    onClick={() => void applySuggestion()}
                  >
                    適用
                  </Button>
                  <Button
                    disabled={selectedSuggestIdx === null}
                    onClick={rejectSuggestion}
                  >
                    プレビュー解除
                  </Button>
                </SpaceBetween>
              </SpaceBetween>
            ),
          },
          {
            id: 'text',
            label: '自然言語',
            content: (
              <SpaceBetween size="m">
                <FormField
                  label="説明"
                  description={`最大 ${String(AI_TEXT_MAX_CHARS)} 文字`}
                >
                  <Input
                    value={nlText}
                    onChange={({ detail }) =>
                      setNlText(detail.value.slice(0, AI_TEXT_MAX_CHARS))
                    }
                    placeholder="例: 幅6m の事務所に壁2枚と柱を置いて"
                  />
                </FormField>
                <Box fontSize="body-s" color="text-body-secondary">
                  {String(nlText.length)}/{String(AI_TEXT_MAX_CHARS)} 文字
                </Box>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={loading || !nlText.trim()}
                    variant="primary"
                    onClick={() => void runNl()}
                  >
                    生成
                  </Button>
                  <Button
                    disabled={loading || !nlText.trim()}
                    onClick={() => void runNl()}
                  >
                    再生成
                  </Button>
                </SpaceBetween>
                {nlPreview && nlPreview.length > 0 ? (
                  <SpaceBetween size="s">
                    <Header variant="h3">プレビュー（{nlPreview.length} 件）</Header>
                    <Table
                      trackBy="id"
                      columnDefinitions={[
                        { id: 'n', header: '名前', cell: (b) => b.name },
                        { id: 't', header: 'IFC', cell: (b) => b.ifcType },
                      ]}
                      items={nlPreview}
                    />
                    <Button variant="primary" onClick={() => void confirmNl()}>
                      確定してプロジェクトに追加
                    </Button>
                  </SpaceBetween>
                ) : null}
              </SpaceBetween>
            ),
          },
          {
            id: 'image',
            label: '画像',
            content: (
              <SpaceBetween size="m">
                <Box fontSize="body-s" color="text-body-secondary">
                  PNG / JPEG / PDF、最大 10MB。信頼度付きで一覧表示し、除外したブロックは追加されません。
                </Box>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => void onImageFile(e.target.files)}
                />
                <Button disabled={loading} onClick={onPickImage}>
                  ファイルを選択
                </Button>
                {imageNote ? <Alert type="info">{imageNote}</Alert> : null}
                {imageRows && imageRows.length > 0 ? (
                  <SpaceBetween size="s">
                    <Table<ImageRow>
                      trackBy="rowId"
                      columnDefinitions={[
                        {
                          id: 'name',
                          header: '名前',
                          cell: (r) => r.block.name,
                        },
                        {
                          id: 'conf',
                          header: '信頼度',
                          cell: (r) => `${String(Math.round(r.confidence))}%`,
                        },
                        {
                          id: 'ex',
                          header: '',
                          cell: (r) => (
                            <Button
                              variant="link"
                              onClick={() => toggleImageExclude(r.rowId)}
                            >
                              {r.excluded ? '含める' : '除外'}
                            </Button>
                          ),
                        },
                      ]}
                      items={imageRows}
                    />
                    <Button
                      variant="primary"
                      disabled={!imageRows.some((r) => !r.excluded)}
                      onClick={() => void confirmImage()}
                    >
                      確定して追加
                    </Button>
                  </SpaceBetween>
                ) : null}
              </SpaceBetween>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
