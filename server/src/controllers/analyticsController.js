import Career from '../models/Career.js';
import User from '../models/User.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';

// @desc    Get analytics for dashboard
// @route   GET /api/analytics/overview
// @access  Private (admin or self)
export const getOverview = async (req, res, next) => {
  try {
    const [userCount, careerCount, analysisCount] = await Promise.all([
      User.countDocuments(),
      Career.countDocuments({ isActive: true }),
      ResumeAnalysis.countDocuments(),
    ]);
    res.json({
      success: true,
      overview: { userCount, careerCount, analysisCount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Most demanded skills (from careers)
// @route   GET /api/analytics/skills
// @access  Public
export const getMostDemandedSkills = async (req, res, next) => {
  try {
    const careers = await Career.find({ isActive: true }).select('required_skills').lean();
    const count = {};
    careers.forEach((c) => {
      (c.required_skills || []).forEach((s) => {
        const key = s.trim().toLowerCase();
        if (key) count[key] = (count[key] || 0) + 1;
      });
    });
    const sorted = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, demand]) => ({ name, demand }));
    res.json({ success: true, skills: sorted });
  } catch (error) {
    next(error);
  }
};

// @desc    Most selected careers (from user careerInterests)
// @route   GET /api/analytics/careers
// @access  Public
export const getMostSelectedCareers = async (req, res, next) => {
  try {
    const users = await User.find().select('careerInterests').lean();
    const count = {};
    users.forEach((u) => {
      (u.careerInterests || []).forEach((c) => {
        const key = (c || '').trim().toLowerCase();
        if (key) count[key] = (count[key] || 0) + 1;
      });
    });
    const sorted = Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
    res.json({ success: true, careers: sorted });
  } catch (error) {
    next(error);
  }
};
