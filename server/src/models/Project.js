import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    career: { type: String, trim: true },
    careerSlug: { type: String, trim: true, lowercase: true },
    skills_gained: [{ type: String }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    github_example: { type: String },
    resources: [{ url: String, title: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectSchema.index({ careerSlug: 1 });
projectSchema.index({ title: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
