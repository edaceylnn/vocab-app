import { parseNoteBody } from './noteDocument';

function collectText(node: unknown, out: string[]): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown>;
  const text = n.text;
  if (typeof text === 'string' && text.trim()) out.push(text);
  const content = n.content;
  if (Array.isArray(content)) {
    for (const child of content) collectText(child, out);
  }
}

export function notePreviewFromBody(body: string, maxLen: number = 120): string {
  const doc = parseNoteBody(body);
  const parts: string[] = [];
  collectText(doc, parts);
  const raw = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

