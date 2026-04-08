import { setStoredToken } from '@/lib/authSession';

describe('notes API (db.api)', () => {
  beforeEach(async () => {
    // Force authSession to use localStorage (web path), since expo-secure-store is mocked as no-op in Jest.
    const rn = await import('react-native');
    (rn.Platform as any).OS = 'web';
    (global as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => (global as any).__ls?.[k] ?? null,
      setItem: (k: string, v: string) => {
        (global as any).__ls = (global as any).__ls ?? {};
        (global as any).__ls[k] = v;
      },
      removeItem: (k: string) => {
        (global as any).__ls = (global as any).__ls ?? {};
        delete (global as any).__ls[k];
      },
      clear: () => {
        (global as any).__ls = {};
      },
    } as unknown as Storage;

    await setStoredToken('test-token');
    (global as any).fetch = jest.fn(async (_url: string, _init?: RequestInit) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    });
  });

  it('calls notes endpoints with auth', async () => {
    const { createNote, listNotes, getNoteById, updateNote, deleteNote, setNotePinned } = await import(
      '@/lib/db.api'
    );

    (global as any).fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'n1',
          title: 'T',
          body: '{"type":"doc","content":[{"type":"paragraph"}]}',
          pinned: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'n1',
          title: 'T',
          body: '{"type":"doc","content":[{"type":"paragraph"}]}',
          pinned: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    const note = await createNote('T', '{"type":"doc","content":[{"type":"paragraph"}]}');
    expect(note.id).toBe('n1');

    await listNotes();
    await getNoteById('n1');
    await updateNote('n1', 'T2', '{"type":"doc","content":[{"type":"paragraph"}]}');
    await setNotePinned('n1', 1);
    await deleteNote('n1');

    const calls = (global as any).fetch.mock.calls as Array<[string, RequestInit]>;
    expect(calls[0][0]).toContain('/api/notes');
    expect((calls[0][1].headers as any).Authorization).toBe('Bearer test-token');
  });
});

