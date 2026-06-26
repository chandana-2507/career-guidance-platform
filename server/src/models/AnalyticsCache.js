import mongoose from 'mongoose';

const analyticsCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    profileHash: { type: String, required: true, index: true },
    profileVersion: { type: Number, default: 0 },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    insights: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);
export default AnalyticsCache;
