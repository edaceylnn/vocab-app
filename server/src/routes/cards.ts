import { Router } from 'express';
import { CardModel } from '../models/Card';

const router = Router();

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toCardRow(doc: { _id: string; setId: string; front: string; back: string; example?: string | null; box: number; nextReviewAt: string; lastReviewedAt?: string | null; correctStreak: number; wrongCount: number }) {
  return {
    id: doc._id,
    setId: doc.setId,
    front: doc.front,
    back: doc.back,
    example: doc.example ?? null,
    box: doc.box,
    nextReviewAt: doc.nextReviewAt,
    lastReviewedAt: doc.lastReviewedAt ?? null,
    correctStreak: doc.correctStreak,
    wrongCount: doc.wrongCount,
  };
}

router.post('/', async (req, res) => {
  try {
    const { setId, front, back, example } = req.body;
    if (!setId || !front || !back) {
      return res.status(400).json({ error: 'setId, front, back are required' });
    }
    const id = uuid();
    const nextReviewAt = todayISO();
    await CardModel.create({
      _id: id,
      setId,
      front,
      back,
      example: example ?? null,
      box: 1,
      nextReviewAt,
      lastReviewedAt: null,
      correctStreak: 0,
      wrongCount: 0,
    });
    const row = await CardModel.findById(id).lean();
    if (!row) throw new Error('Card not created');
    res.status(201).json(toCardRow(row));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await CardModel.find().sort({ front: 1 }).lean();
    res.json(rows.map(toCardRow));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/by-set/:setId', async (req, res) => {
  try {
    const { search } = req.query;
    const query: Record<string, unknown> = { setId: req.params.setId };
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { front: new RegExp(q, 'i') },
        { back: new RegExp(q, 'i') },
      ];
    }
    const rows = await CardModel.find(query).sort({ front: 1 }).lean();
    res.json(rows.map(toCardRow));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/for-study/:setId', async (req, res) => {
  try {
    const rows = await CardModel.find({ setId: req.params.setId }).sort({ front: 1 }).lean();
    res.json(rows.map(toCardRow));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/due', async (req, res) => {
  try {
    const setId = req.query.setId as string | undefined;
    const today = todayISO();
    const query: Record<string, unknown> = { nextReviewAt: { $lte: today } };
    if (setId) query.setId = setId;
    const rows = await CardModel.find(query).sort({ nextReviewAt: 1 }).lean();
    res.json(rows.map(toCardRow));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/due-count', async (req, res) => {
  try {
    const setId = req.query.setId as string | undefined;
    const today = todayISO();
    const query: Record<string, unknown> = { nextReviewAt: { $lte: today } };
    if (setId) query.setId = setId;
    const count = await CardModel.countDocuments(query);
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/today-reviewed-count', async (_req, res) => {
  try {
    const today = todayISO();
    const count = await CardModel.countDocuments({
      lastReviewedAt: new RegExp(`^${today}`),
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/total-count', async (_req, res) => {
  try {
    const count = await CardModel.countDocuments();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/box-counts', async (_req, res) => {
  try {
    const agg = await CardModel.aggregate([{ $group: { _id: '$box', c: { $sum: 1 } } }]);
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of agg) counts[r._id] = r.c;
    res.json(counts);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const rows = await CardModel.find().sort({ lastReviewedAt: -1 }).limit(limit).lean();
    res.json(rows.map(toCardRow));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await CardModel.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(toCardRow(row));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { front, back, example } = req.body;
    const doc = await CardModel.findByIdAndUpdate(
      req.params.id,
      { $set: { front, back, example: example ?? null } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(toCardRow(doc));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/:id/reviewed', async (req, res) => {
  try {
    const doc = await CardModel.findByIdAndUpdate(
      req.params.id,
      { $set: { lastReviewedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(toCardRow(doc));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post('/:id/after-review', async (req, res) => {
  try {
    const { newBox, nextReviewAt, correct } = req.body;
    if (newBox == null || !nextReviewAt || typeof correct !== 'boolean') {
      return res.status(400).json({ error: 'newBox, nextReviewAt, correct required' });
    }
    const now = new Date().toISOString();
    const doc = await CardModel.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await CardModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          box: newBox,
          nextReviewAt,
          lastReviewedAt: now,
          ...(correct ? {} : { correctStreak: 0 }),
        },
        $inc: correct ? { correctStreak: 1 } : { wrongCount: 1 },
      }
    );
    const updated = await CardModel.findById(req.params.id).lean();
    if (!updated) return res.status(500).json({ error: 'Update failed' });
    res.json(toCardRow(updated));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await CardModel.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
