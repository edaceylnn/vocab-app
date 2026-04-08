import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

SetSchema.index({ userId: 1, name: 1 });

export const SetModel = mongoose.model('Set', SetSchema);
