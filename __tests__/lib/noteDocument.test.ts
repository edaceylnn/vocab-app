import { EMPTY_TIPTAP_DOC, parseNoteBody } from '@/lib/noteDocument';

describe('noteDocument', () => {
  it('parses valid doc JSON', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] };
    const out = parseNoteBody(JSON.stringify(doc));
    expect(out.type).toBe('doc');
    expect(out).toEqual(doc);
  });

  it('returns empty doc for invalid JSON', () => {
    const out = parseNoteBody('not-json');
    expect(out).toEqual(EMPTY_TIPTAP_DOC);
  });

  it('returns empty doc when type is not doc', () => {
    const out = parseNoteBody(JSON.stringify({ type: 'bogus' }));
    expect(out).toEqual(EMPTY_TIPTAP_DOC);
  });
});
