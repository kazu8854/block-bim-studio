import type { BlockCatalogEntry } from '@/data/block-catalog';

export const PALETTE_DRAG_MIME = 'application/x-block-bim-catalog+json';

export function setPaletteDragData(
  dataTransfer: DataTransfer,
  entry: BlockCatalogEntry,
): void {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(PALETTE_DRAG_MIME, JSON.stringify(entry));
}

export function parsePaletteDropData(
  dataTransfer: DataTransfer,
): BlockCatalogEntry | null {
  const raw = dataTransfer.getData(PALETTE_DRAG_MIME);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as BlockCatalogEntry;
    if (
      v &&
      typeof v.id === 'string' &&
      typeof v.name === 'string' &&
      typeof v.ifcType === 'string' &&
      typeof v.category === 'string' &&
      v.defaultDimensions &&
      typeof v.defaultDimensions.width === 'number'
    ) {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function useDragDrop() {
  return { setPaletteDragData, parsePaletteDropData, PALETTE_DRAG_MIME };
}
