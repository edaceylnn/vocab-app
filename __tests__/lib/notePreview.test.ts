import { notePreviewFromBody } from '@/lib/notePreview';

describe('notePreview', () => {
  it('extracts plain text from tiptap json', () => {
    const body = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'world' }] },
      ],
    });
    expect(notePreviewFromBody(body, 120)).toBe('Hello world');
  });

  it('truncates with ellipsis', () => {
    const body = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a'.repeat(300) }] }],
    });
    const out = notePreviewFromBody(body, 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith('…')).toBe(true);
  });

  it('returns empty for empty docs', () => {
    const body = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
    expect(notePreviewFromBody(body, 120)).toBe('');
  });
});

