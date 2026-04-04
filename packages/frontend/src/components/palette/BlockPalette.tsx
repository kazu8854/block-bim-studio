import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Tabs from '@cloudscape-design/components/tabs';
import type { BlockCategory } from '@block-bim-studio/shared';
import { useMemo, useState } from 'react';
import {
  type BlockCatalogEntry,
  CATEGORY_LABELS,
  catalogByCategory,
  filterCatalogBySearch,
} from '@/data/block-catalog';

export type BlockPaletteProps = {
  onSelectBlock: (entry: BlockCatalogEntry) => void;
};

const CATEGORIES: BlockCategory[] = ['structure', 'opening', 'equipment'];

export function BlockPalette({ onSelectBlock }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('structure');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const base = catalogByCategory(activeCategory);
    return filterCatalogBySearch(base, search);
  }, [activeCategory, search]);

  return (
    <Container
      header={<Header variant="h2">ブロックパレット</Header>}
    >
      <SpaceBetween size="m">
        <Input
          value={search}
          onChange={({ detail }) => setSearch(detail.value)}
          placeholder="名称・IFC タイプで検索…"
          type="search"
        />
        <Tabs
          activeTabId={activeCategory}
          onChange={({ detail }) =>
            setActiveCategory(detail.activeTabId as BlockCategory)
          }
          tabs={CATEGORIES.map((cat) => ({
            id: cat,
            label: CATEGORY_LABELS[cat],
            content: (
              <Box padding={{ top: 'm' }}>
                <ColumnLayout columns={2} variant="text-grid">
                  {filtered.map((entry) => (
                    <Box key={entry.id}>
                      <button
                        type="button"
                        onClick={() => onSelectBlock(entry)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #d5dbdb',
                          background: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <SpaceBetween size="xs">
                          <Box variant="strong">{entry.name}</Box>
                          <Box fontSize="body-s" color="text-body-secondary">
                            {entry.ifcType}
                          </Box>
                          <Box fontSize="body-s" color="text-body-secondary">
                            {entry.defaultDimensions.width} ×{' '}
                            {entry.defaultDimensions.height} ×{' '}
                            {entry.defaultDimensions.depth} m
                          </Box>
                        </SpaceBetween>
                      </button>
                    </Box>
                  ))}
                </ColumnLayout>
                {filtered.length === 0 ? (
                  <Box color="text-body-secondary" textAlign="center" padding="l">
                    該当するブロックがありません
                  </Box>
                ) : null}
              </Box>
            ),
          }))}
        />
      </SpaceBetween>
    </Container>
  );
}
