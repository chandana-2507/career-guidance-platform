import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: { type: String },
    fileName: { type: String },
    resumeHash: { type: String, index: true },
    score: { type: Number, min: 0, max: 100 },
    overallScore: { type: Number, min: 0, max: 100 },
    summary: { type: String },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missingSkills: [{ type: String }],
    atsScore: { type: Number, min: 0, max: 100 },
    careerSuggestions: [{ type: String }],
    recommendedCertifications: [{ type: String }],
    improvementSuggestions: [{ type: String }],
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
resumeAnalysisSchema.index({ user: 1, resumeHash: 1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
