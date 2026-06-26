import mongoose from 'mongoose';

const careerRecommendationCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    profileFingerprint: { type: String, required: true, index: true },
    profileHash: { type: String, default: '' },
    profileVersion: { type: Number, default: 0 },
    recommendations: { type: mongoose.Schema.Types.Mixed, default: [] },
    history: [
      {
        recommendations: { type: mongoose.Schema.Types.Mixed, default: [] },
        generatedAt: { type: Date, default: Date.now },
        profileFingerprint: { type: String, default: '' },
        profileVersion: { type: Number, default: 0 },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const CareerRecommendationCache = mongoose.model(
  'CareerRecommendationCache',
  careerRecommendationCacheSchema,
);
export default CareerRecommendationCache;
