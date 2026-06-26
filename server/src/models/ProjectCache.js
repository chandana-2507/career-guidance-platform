import mongoose from 'mongoose';

const projectCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    career: { type: String, default: '', trim: true },
    difficulty: { type: String, default: 'intermediate' },
    profileHash: { type: String, required: true, index: true },
    profileVersion: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

projectCacheSchema.index({ userId: 1, career: 1, difficulty: 1 });

const ProjectCache = mongoose.model('ProjectCache', projectCacheSchema);
export default ProjectCache;
