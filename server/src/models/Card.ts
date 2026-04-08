import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    setId: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    example: { type: String, default: null },
    box: { type: Number, required: true, default: 1 },
    nextReviewAt: { type: String, required: true },
    lastReviewedAt: { type: String, default: null },
    correctStreak: { type: Number, required: true, default: 0 },
    wrongCount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

CardSchema.index({ userId: 1, setId: 1 });
CardSchema.index({ nextReviewAt: 1 });

export const CardModel = mongoose.model('Card', CardSchema);
