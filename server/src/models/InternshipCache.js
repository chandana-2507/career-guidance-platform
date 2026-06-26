import mongoose from 'mongoose';

const internshipCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    career: { type: String, default: '', trim: true },
    profileHash: { type: String, required: true, index: true },
    profileVersion: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

internshipCacheSchema.index({ userId: 1, career: 1 });

const InternshipCache = mongoose.model('InternshipCache', internshipCacheSchema);
export default InternshipCache;
