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
    recommendedCareers: [{ type: String, trim: true }],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const UserCareerProfile = mongoose.model('UserCareerProfile', userCareerProfileSchema);
export default UserCareerProfile;
