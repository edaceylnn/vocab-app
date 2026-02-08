import mongoose from 'mongoose';

const SetSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

export const SetModel = mongoose.model('Set', SetSchema);
