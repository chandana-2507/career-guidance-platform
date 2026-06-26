import mongoose from 'mongoose';

const roadmapProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerTitle: { type: String, required: true, trim: true },
    roadmap: { type: mongoose.Schema.Types.Mixed, default: {} },
    completedItems: [{ type: String, trim: true }],
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    profileFingerprint: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

roadmapProgressSchema.index({ userId: 1, careerTitle: 1 }, { unique: true });

const RoadmapProgress = mongoose.model('RoadmapProgress', roadmapProgressSchema);
export default RoadmapProgress;
