import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: { type: String, enum: ['technical', 'soft', 'domain', 'tool'], default: 'technical' },
    description: { type: String },
    relatedCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Career' }],
    learningResources: [{ url: String, title: String, type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ name: 'text' });
skillSchema.index({ category: 1 });

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
