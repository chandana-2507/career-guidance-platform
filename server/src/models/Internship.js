import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    skills_required: [{ type: String, trim: true }],
    location: { type: String, default: '' },
    remote: { type: Boolean, default: false },
    apply_link: { type: String },
    description: { type: String },
    career: { type: String, trim: true },
    careerSlug: { type: String, trim: true, lowercase: true },
    stipend: { type: String },
    duration: { type: String },
    postedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

internshipSchema.index({ careerSlug: 1 });
internshipSchema.index({ role: 'text', company: 'text' });

const Internship = mongoose.model('Internship', internshipSchema);
export default Internship;
