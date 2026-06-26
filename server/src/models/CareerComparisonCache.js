import mongoose from 'mongoose';

const careerComparisonCacheSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerA: { type: String, required: true },
    careerB: { type: String, required: true },
    profileHash: { type: String, required: true },
    result: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

careerComparisonCacheSchema.index({ userId: 1, careerA: 1, careerB: 1 });

const CareerComparisonCache = mongoose.model(
  'CareerComparisonCache',
  careerComparisonCacheSchema,
);
export default CareerComparisonCache;
