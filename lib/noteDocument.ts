/** Default empty Tiptap document (matches @10play/tentap-editor StarterKit). */
export const EMPTY_TIPTAP_DOC: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export function parseNoteBody(json: string): Record<string, unknown> {
  try {
    const o = JSON.parse(json) as unknown;
    if (o && typeof o === 'object' && !Array.isArray(o) && (o as { type?: string }).type === 'doc') {
      return o as Record<string, unknown>;
    }
  } catch {
    // invalid JSON
  }
  return { ...EMPTY_TIPTAP_DOC };
}
