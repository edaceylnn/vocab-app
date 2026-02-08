import { Router } from 'express';
import { SetModel } from '../models/Set';
import { CardModel } from '../models/Card';

const router = Router();

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const id = uuid();
    const createdAt = new Date().toISOString();
    await SetModel.create({ _id: id, name, createdAt });
    res.status(201).json({ id, name, createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/', async (_req, res) => {
  try {
    const rows = await SetModel.find().sort({ createdAt: -1 }).lean();
    const sets = rows.map((r) => ({ id: r._id, name: r.name, createdAt: r.createdAt }));
    res.json(sets);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const DEFAULT_SET_NAME = 'Default';

router.get('/default', async (_req, res) => {
  try {
    let set = await SetModel.findOne({ name: DEFAULT_SET_NAME }).lean();
    if (!set) {
      const id = uuid();
      const createdAt = new Date().toISOString();
      await SetModel.create({ _id: id, name: DEFAULT_SET_NAME, createdAt });
      set = { _id: id, name: DEFAULT_SET_NAME, createdAt };
    }
    res.json({ id: set._id, name: set.name, createdAt: set.createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const set = await SetModel.findById(req.params.id).lean();
    if (!set) return res.status(404).json({ error: 'Not found' });
    res.json({ id: set._id, name: set.name, createdAt: set.createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id/count', async (req, res) => {
  try {
    const count = await CardModel.countDocuments({ setId: req.params.id });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
