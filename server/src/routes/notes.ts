import { Router } from 'express';
import { NoteModel } from '../models/Note';

const router = Router();

function toNoteRow(doc: {
  _id: string;
  userId: string;
  title: string;
  body: string;
  pinned?: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc._id,
    title: doc.title,
    body: doc.body,
    pinned: doc.pinned ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

router.get('/', async (req, res) => {
  try {
    const userId = req.userId!;
    const rows = await NoteModel.find({ userId })
      .sort({ pinned: -1, updatedAt: -1 })
      .lean();
    res.json(rows.map((r) => toNoteRow(r as any)));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.userId!;
    const { title, body, pinned } = req.body as { title?: unknown; body?: unknown; pinned?: unknown };
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'body is required' });
    }
    const doc = await NoteModel.create({
      userId,
      title,
      body,
      pinned: typeof pinned === 'number' ? pinned : 0,
    });
    const row = await NoteModel.findOne({ _id: doc._id, userId }).lean();
    if (!row) throw new Error('Note not created');
    res.status(201).json(toNoteRow(row as any));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId!;
    const row = await NoteModel.findOne({ _id: req.params.id, userId }).lean();
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toNoteRow(row as any));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId!;
    const { title, body, pinned } = req.body as { title?: unknown; body?: unknown; pinned?: unknown };
    const update: Record<string, unknown> = {};
    if (typeof title === 'string') update.title = title;
    if (typeof body === 'string') update.body = body;
    if (typeof pinned === 'number') update.pinned = pinned;
    const row = await NoteModel.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: update },
      { new: true }
    ).lean();
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toNoteRow(row as any));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId!;
    const row = await NoteModel.findOneAndDelete({ _id: req.params.id, userId }).lean();
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;

