function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => {
        delete store[k];
      });
    },
  };
}

describe('notesStorage (web local)', () => {
  beforeEach(() => {
    (global as unknown as { localStorage: Storage }).localStorage = mockLocalStorage() as unknown as Storage;
  });

  it('creates, updates, lists, and deletes notes', async () => {
    const { createNote, listNotes, getNoteById, updateNote, deleteNote } = await import(
      '@/lib/db.web.local'
    );

    const a = await createNote('First');
    expect(a.title).toBe('First');
    expect(JSON.parse(a.body).type).toBe('doc');

    let list = await listNotes();
    expect(list).toHaveLength(1);

    const body = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }],
    });
    await updateNote(a.id, 'Renamed', body);

    const row = await getNoteById(a.id);
    expect(row?.title).toBe('Renamed');
    expect(row!.body).toContain('"text":"x"');

    await deleteNote(a.id);
    list = await listNotes();
    expect(list).toHaveLength(0);
  });
});
