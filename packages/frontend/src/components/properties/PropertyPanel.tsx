import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table, { type TableProps } from '@cloudscape-design/components/table';
import Tabs from '@cloudscape-design/components/tabs';
import type { Block, PropertySet, PropertyValue } from '@block-bim-studio/shared';
import { syncQtoBaseQuantitiesWithDimensions } from '@block-bim-studio/shared';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScheduleTab } from '@/components/properties/ScheduleTab';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { isDefaultPropertySetName } from '@/utils/default-property-sets';

const NUMERIC_KEYS = new Set([
  'Length',
  'Area',
  'Volume',
  'UnitPrice',
]);

function parsePositiveDim(raw: string): { ok: true; value: number } | { ok: false; msg: string } {
  const t = raw.trim();
  if (t === '') return { ok: false, msg: '必須です' };
  const n = Number(t);
  if (Number.isNaN(n) || n <= 0) {
    return { ok: false, msg: '正の数値を入力してください' };
  }
  return { ok: true, value: n };
}

function canCommitSpatialNumber(raw: string): boolean {
  const t = raw.trim();
  if (t === '' || t === '-' || t === '.' || t === '-.') return false;
  if (t.endsWith('.')) return false;
  const n = Number(t);
  return Number.isFinite(n);
}

function parsePropertyValue(
  key: string,
  raw: string,
): { ok: true; value: PropertyValue } | { ok: false; msg: string } {
  if (NUMERIC_KEYS.has(key)) {
    const t = raw.trim();
    if (t === '') return { ok: false, msg: '数値を入力してください' };
    const n = Number(t);
    if (Number.isNaN(n)) return { ok: false, msg: '数値として解釈できません' };
    return { ok: true, value: n };
  }
  return { ok: true, value: raw };
}

export function PropertyPanel() {
  const project = useProjectStore((s) => s.project);
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId);
  const updateBlock = useProjectStore((s) => s.updateBlock);
  const removeBlock = useProjectStore((s) => s.removeBlock);

  const selected = useMemo(() => {
    if (!project || !selectedBlockId) return null;
    return project.blocks.find((b) => b.id === selectedBlockId) ?? null;
  }, [project, selectedBlockId]);

  const [draft, setDraft] = useState<Block | null>(null);
  const [dimErrors, setDimErrors] = useState<{
    width?: string;
    height?: string;
    depth?: string;
  }>({});
  const [propErrors, setPropErrors] = useState<Record<string, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newPsetName, setNewPsetName] = useState('');
  const [dimInputs, setDimInputs] = useState({ w: '', h: '', d: '' });
  const [tfInputs, setTfInputs] = useState({
    px: '',
    py: '',
    pz: '',
    rx: '',
    ry: '',
    rz: '',
  });
  const [tfErrors, setTfErrors] = useState<
    Partial<Record<'px' | 'py' | 'pz' | 'rx' | 'ry' | 'rz', string>>
  >({});

  useEffect(() => {
    if (selected) {
      setDraft({ ...selected });
      setDimInputs({
        w: String(selected.dimensions.width),
        h: String(selected.dimensions.height),
        d: String(selected.dimensions.depth),
      });
      setTfInputs({
        px: String(selected.position.x),
        py: String(selected.position.y),
        pz: String(selected.position.z),
        rx: String(selected.rotation.x),
        ry: String(selected.rotation.y),
        rz: String(selected.rotation.z),
      });
      setDimErrors({});
      setPropErrors({});
      setTfErrors({});
    } else {
      setDraft(null);
    }
  }, [selected]);

  const applyDraft = useCallback(() => {
    if (!draft) return;
    const ew = parsePositiveDim(dimInputs.w);
    const eh = parsePositiveDim(dimInputs.h);
    const ed = parsePositiveDim(dimInputs.d);
    setDimErrors({
      width: ew.ok ? undefined : ew.msg,
      height: eh.ok ? undefined : eh.msg,
      depth: ed.ok ? undefined : ed.msg,
    });
    if (!ew.ok || !eh.ok || !ed.ok) return;
    if (Object.values(propErrors).some(Boolean)) return;
    const next: Block = syncQtoBaseQuantitiesWithDimensions({
      ...draft,
      dimensions: { width: ew.value, height: eh.value, depth: ed.value },
    });
    updateBlock(next);
    setDraft(next);
  }, [draft, dimInputs, propErrors, updateBlock]);

  const updatePositionField = (
    axis: 'x' | 'y' | 'z',
    inputKey: 'px' | 'py' | 'pz',
    raw: string,
  ) => {
    setTfInputs((prev) => ({ ...prev, [inputKey]: raw }));
    if (!canCommitSpatialNumber(raw)) {
      setTfErrors((e) => {
        const next = { ...e };
        const t = raw.trim();
        if (t === '' || t === '-' || t === '.' || t === '-.' || t.endsWith('.')) {
          delete next[inputKey];
        } else {
          next[inputKey] = '数値として解釈できません';
        }
        return next;
      });
      return;
    }
    setTfErrors((e) => {
      const next = { ...e };
      delete next[inputKey];
      return next;
    });
    if (!draft) return;
    const n = Number(raw.trim());
    const next: Block = {
      ...draft,
      position: { ...draft.position, [axis]: n },
    };
    updateBlock(next);
    setDraft(next);
  };

  const updateRotationField = (
    axis: 'x' | 'y' | 'z',
    inputKey: 'rx' | 'ry' | 'rz',
    raw: string,
  ) => {
    setTfInputs((prev) => ({ ...prev, [inputKey]: raw }));
    if (!canCommitSpatialNumber(raw)) {
      setTfErrors((e) => {
        const next = { ...e };
        const t = raw.trim();
        if (t === '' || t === '-' || t === '.' || t === '-.' || t.endsWith('.')) {
          delete next[inputKey];
        } else {
          next[inputKey] = '数値として解釈できません';
        }
        return next;
      });
      return;
    }
    setTfErrors((e) => {
      const next = { ...e };
      delete next[inputKey];
      return next;
    });
    if (!draft) return;
    const n = Number(raw.trim());
    const next: Block = {
      ...draft,
      rotation: { ...draft.rotation, [axis]: n },
    };
    updateBlock(next);
    setDraft(next);
  };

  const updateDimensionInput = (
    key: 'w' | 'h' | 'd',
    raw: string,
    dimKey: 'width' | 'height' | 'depth',
  ) => {
    setDimInputs((prev) => ({ ...prev, [key]: raw }));
    const parsed = parsePositiveDim(raw);
    setDimErrors((e) => ({
      ...e,
      [dimKey]: parsed.ok || raw.trim() === '' ? undefined : parsed.msg,
    }));
    if (parsed.ok && draft) {
      setDraft({
        ...draft,
        dimensions: {
          ...draft.dimensions,
          [dimKey]: parsed.value,
        },
      });
    }
  };

  const updateProperty = (psetIndex: number, pkey: string, raw: string) => {
    if (!draft) return;
    const parsed = parsePropertyValue(pkey, raw);
    const errKey = `${String(psetIndex)}:${pkey}`;
    setPropErrors((e) => {
      const next = { ...e };
      if (parsed.ok) delete next[errKey];
      else next[errKey] = parsed.msg;
      return next;
    });
    if (!parsed.ok) return;
    const sets = draft.propertySets.map((ps, i) => {
      if (i !== psetIndex) return ps;
      return {
        ...ps,
        properties: { ...ps.properties, [pkey]: parsed.value },
      };
    });
    setDraft({ ...draft, propertySets: sets });
  };

  const addPropertySet = () => {
    const name = newPsetName.trim();
    if (!name || !draft) return;
    if (draft.propertySets.some((p) => p.name === name)) {
      return;
    }
    setDraft({
      ...draft,
      propertySets: [...draft.propertySets, { name, properties: {} }],
    });
    setNewPsetName('');
    setModalVisible(false);
  };

  const propertyTableColumns = (
    _pset: PropertySet,
    psetIndex: number,
  ): TableProps<PropertyRow>['columnDefinitions'] => [
    {
      id: 'key',
      header: 'プロパティ',
      cell: (item) => item.key,
      width: 160,
    },
    {
      id: 'value',
      header: '値',
      cell: (item) => (
        <FormField
          errorText={propErrors[`${String(psetIndex)}:${item.key}`]}
        >
          <Input
            value={String(item.display)}
            onChange={({ detail }) =>
              updateProperty(psetIndex, item.key, detail.value)
            }
          />
        </FormField>
      ),
    },
  ];

  type PropertyRow = { key: string; display: string | number | boolean };

  if (!project) {
    return (
      <Container header={<Header variant="h2">属性</Header>}>
        <Alert type="info">プロジェクトを読み込んでください</Alert>
      </Container>
    );
  }

  if (!draft || !selectedBlockId) {
    return (
      <Container header={<Header variant="h2">属性</Header>}>
        <Alert type="info">
          パレットまたは 3D キャンバスでブロックを選択してください。
        </Alert>
      </Container>
    );
  }

  const hasErrors =
    Object.values(dimErrors).some(Boolean) ||
    Object.values(propErrors).some(Boolean) ||
    Object.values(tfErrors).some(Boolean);

  const dimW = dimInputs.w;
  const dimH = dimInputs.h;
  const dimD = dimInputs.d;

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button disabled={hasErrors} onClick={applyDraft}>
                  変更を適用
                </Button>
                <Button variant="primary" onClick={() => removeBlock(draft.id)}>
                  ブロックを削除
                </Button>
              </SpaceBetween>
            }
          >
            属性パネル
          </Header>
        }
      >
        <Tabs
          tabs={[
            {
              id: 'general',
              label: '基本',
              content: (
                <SpaceBetween size="l">
                  <FormField label="名称">
                    <Input
                      value={draft.name}
                      onChange={({ detail }) =>
                        setDraft({ ...draft, name: detail.value })
                      }
                    />
                  </FormField>
                  <FormField label="IFC 要素タイプ">
                    <Box>{draft.ifcType}</Box>
                  </FormField>
                  <FormField label="カテゴリ">
                    <Box>{draft.category}</Box>
                  </FormField>

                  <Header variant="h3">位置 (m)</Header>
                  <Box fontSize="body-s" color="text-body-secondary">
                    値を変更すると 3D キャンバスにすぐ反映されます（Three.js の座標系）。
                  </Box>
                  <ColumnFields>
                    <FormField label="X" errorText={tfErrors.px}>
                      <Input
                        value={tfInputs.px}
                        onChange={({ detail }) =>
                          updatePositionField('x', 'px', detail.value)
                        }
                      />
                    </FormField>
                    <FormField label="Y" errorText={tfErrors.py}>
                      <Input
                        value={tfInputs.py}
                        onChange={({ detail }) =>
                          updatePositionField('y', 'py', detail.value)
                        }
                      />
                    </FormField>
                    <FormField label="Z" errorText={tfErrors.pz}>
                      <Input
                        value={tfInputs.pz}
                        onChange={({ detail }) =>
                          updatePositionField('z', 'pz', detail.value)
                        }
                      />
                    </FormField>
                  </ColumnFields>

                  <Header variant="h3">回転 (rad)</Header>
                  <Box fontSize="body-s" color="text-body-secondary">
                    オイラー角（ラジアン）。G / R キーで移動・回転ハンドルを切り替えられます。
                  </Box>
                  <ColumnFields>
                    <FormField label="X" errorText={tfErrors.rx}>
                      <Input
                        value={tfInputs.rx}
                        onChange={({ detail }) =>
                          updateRotationField('x', 'rx', detail.value)
                        }
                      />
                    </FormField>
                    <FormField label="Y" errorText={tfErrors.ry}>
                      <Input
                        value={tfInputs.ry}
                        onChange={({ detail }) =>
                          updateRotationField('y', 'ry', detail.value)
                        }
                      />
                    </FormField>
                    <FormField label="Z" errorText={tfErrors.rz}>
                      <Input
                        value={tfInputs.rz}
                        onChange={({ detail }) =>
                          updateRotationField('z', 'rz', detail.value)
                        }
                      />
                    </FormField>
                  </ColumnFields>

                  <Header variant="h3">寸法 (m)</Header>
                  <ColumnFields>
                    <FormField label="幅" errorText={dimErrors.width}>
                      <Input
                        value={dimW}
                        onChange={({ detail }) =>
                          updateDimensionInput('w', detail.value, 'width')
                        }
                      />
                    </FormField>
                    <FormField label="高さ" errorText={dimErrors.height}>
                      <Input
                        value={dimH}
                        onChange={({ detail }) =>
                          updateDimensionInput('h', detail.value, 'height')
                        }
                      />
                    </FormField>
                    <FormField label="奥行" errorText={dimErrors.depth}>
                      <Input
                        value={dimD}
                        onChange={({ detail }) =>
                          updateDimensionInput('d', detail.value, 'depth')
                        }
                      />
                    </FormField>
                  </ColumnFields>

                  <SpaceBetween size="m">
                    {draft.propertySets.map((pset, idx) => {
                      const items: PropertyRow[] = Object.entries(
                        pset.properties,
                      ).map(([key, value]) => ({
                        key,
                        display:
                          typeof value === 'boolean'
                            ? value
                              ? 'true'
                              : 'false'
                            : value,
                      }));
                      return (
                        <div key={`${pset.name}-${String(idx)}`}>
                          <Header
                            variant="h3"
                            description={
                              isDefaultPropertySetName(pset.name)
                                ? '既定 PropertySet'
                                : 'カスタム PropertySet'
                            }
                          >
                            {pset.name}
                          </Header>
                          <Table
                            columnDefinitions={propertyTableColumns(pset, idx)}
                            items={items}
                            loadingText="読み込み中"
                            empty={
                              <Box color="text-body-secondary" padding="s">
                                プロパティがありません
                              </Box>
                            }
                          />
                        </div>
                      );
                    })}
                  </SpaceBetween>

                  <Button onClick={() => setModalVisible(true)}>
                    PropertySet を追加
                  </Button>
                </SpaceBetween>
              ),
            },
            {
              id: 'schedule',
              label: '工程',
              content: <ScheduleTab blockId={draft.id} />,
            },
          ]}
          ariaLabel="属性パネルのタブ"
        />
      </Container>

      <Modal
        onDismiss={() => setModalVisible(false)}
        visible={modalVisible}
        closeAriaLabel="閉じる"
        header="PropertySet を追加"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setModalVisible(false)}>
                キャンセル
              </Button>
              <Button
                variant="primary"
                disabled={!newPsetName.trim()}
                onClick={addPropertySet}
              >
                追加
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="PropertySet 名">
          <Input
            value={newPsetName}
            onChange={({ detail }) => setNewPsetName(detail.value)}
          />
        </FormField>
      </Modal>
    </>
  );
}

function ColumnFields({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  );
}
