import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    college: { type: String, default: '' },
    degree: { type: String, default: '' },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    careerGoals: { type: String, default: '' },
    careerGoal: { type: String, default: '' },
    resumeUrl: { type: String },
    resumePublicId: { type: String },
    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioLinks: [{ type: String }],
    careerInterests: [{ type: String }],
    preferredIndustry: { type: String, default: '', trim: true },
    preferredRole: { type: String, default: '', trim: true },
    branch: { type: String, default: '', trim: true },
    certifications: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    experience: { type: String, default: '' },
  },
  { timestamps: true }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
