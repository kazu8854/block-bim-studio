import type { Block } from '@block-bim-studio/shared';
import { fetchJson } from '@/api/http';

export type IfcExportResult = {
  projectId: string;
  filename: string;
  ifcBase64: string;
};

export async function exportIfc(projectId: string): Promise<IfcExportResult> {
  return fetchJson<IfcExportResult>(`/api/ifc/export/${projectId}`, {
    method: 'POST',
  });
}

export async function importIfc(ifcBase64: string): Promise<{
  blocks: Block[];
  warnings: string[];
}> {
  return fetchJson<{ blocks: Block[]; warnings: string[] }>('/api/ifc/import', {
    method: 'POST',
    body: JSON.stringify({ ifcBase64 }),
  });
}

export function downloadIfcFile(filename: string, ifcBase64: string): void {
  const bin = Uint8Array.from(atob(ifcBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bin], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ifc') ? filename : `${filename}.ifc`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readFileAsBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
