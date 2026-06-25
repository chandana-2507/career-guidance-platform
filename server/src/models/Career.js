import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema(
  {
    career_name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    required_skills: [{ type: String, trim: true }],
    average_salary: { type: Number },
    salary_currency: { type: String, default: 'USD' },
    industry_demand: { type: String, enum: ['low', 'medium', 'high', 'very_high'], default: 'medium' },
    description: { type: String },
    roadmap_steps: [{ type: String }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    growth_potential: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
    industry: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

careerSchema.index({ career_name: 'text', description: 'text' });
careerSchema.index({ isActive: 1 });

careerSchema.pre('save', function (next) {
  if (this.isModified('career_name') && !this.slug) {
    this.slug = this.career_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

const Career = mongoose.model('Career', careerSchema);
export default Career;
