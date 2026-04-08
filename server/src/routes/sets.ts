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
    const userId = req.userId!;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const id = uuid();
    const createdAt = new Date().toISOString();
    await SetModel.create({ _id: id, userId, name, createdAt });
    res.status(201).json({ id, name, createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.userId!;
    const rows = await SetModel.find({ userId }).sort({ createdAt: -1 }).lean();
    const sets = rows.map((r) => ({ id: r._id, name: r.name, createdAt: r.createdAt }));
    res.json(sets);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const DEFAULT_SET_NAME = 'Default';

router.get('/default', async (req, res) => {
  try {
    const userId = req.userId!;
    let set = await SetModel.findOne({ userId, name: DEFAULT_SET_NAME }).lean();
    if (!set) {
      const id = uuid();
      const createdAt = new Date().toISOString();
      await SetModel.create({ _id: id, userId, name: DEFAULT_SET_NAME, createdAt });
      set = await SetModel.findOne({ userId, name: DEFAULT_SET_NAME }).lean();
    }
    if (!set) {
      return res.status(500).json({ error: 'Failed to create default set' });
    }
    res.json({ id: set._id, name: set.name, createdAt: set.createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id/count', async (req, res) => {
  try {
    const userId = req.userId!;
    const set = await SetModel.findOne({ _id: req.params.id, userId }).lean();
    if (!set) return res.status(404).json({ error: 'Not found' });
    const count = await CardModel.countDocuments({ setId: req.params.id, userId });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId!;
    const set = await SetModel.findOne({ _id: req.params.id, userId }).lean();
    if (!set) return res.status(404).json({ error: 'Not found' });
    res.json({ id: set._id, name: set.name, createdAt: set.createdAt });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
