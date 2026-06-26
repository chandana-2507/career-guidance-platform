import mongoose from 'mongoose';

const skillGapCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    career: { type: String, required: true, trim: true },
    profileHash: { type: String, required: true, index: true },
    result: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

skillGapCacheSchema.index({ userId: 1, career: 1 }, { unique: true });

const SkillGapCache = mongoose.model('SkillGapCache', skillGapCacheSchema);
export default SkillGapCache;
