import mongoose from 'mongoose';

const userCareerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    education: { type: String, default: '' },
    interests: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    strengths: [{ type: String, trim: true }],
    goals: { type: String, default: '' },
    preferredIndustries: [{ type: String, trim: true }],
    preferredRole: { type: String, default: '', trim: true },
    recommendedCareers: [{ type: String, trim: true }],
    resumeInsights: { type: mongoose.Schema.Types.Mixed, default: null },
    lastChatSummary: { type: String, default: '' },
    previousRoadmaps: [{
      careerTitle: { type: String, trim: true },
      generatedAt: { type: Date, default: Date.now },
    }],
    profileUpdateHistory: [{ type: Date }],
    profileVersion: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const UserCareerProfile = mongoose.model('UserCareerProfile', userCareerProfileSchema);
export default UserCareerProfile;
