import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    pinned: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });

export const NoteModel = mongoose.model('Note', NoteSchema);

