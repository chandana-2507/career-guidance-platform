import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: { type: String },
    score: { type: Number, min: 0, max: 100 },
    extractedSkills: [{ type: String }],
    extractedEducation: [{ type: String }],
    extractedExperience: [{ type: String }],
    suggestions: [{ type: String }],
    missingKeywords: [{ type: String }],
    targetCareer: { type: String },
    rawAnalysis: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
