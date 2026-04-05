import type { Block } from '@block-bim-studio/shared';

/** Zustand セレクタで `?? []` すると毎回新配列になり useSyncExternalStore がループするため共用 */
export const EMPTY_BLOCK_ARRAY: Block[] = [];
