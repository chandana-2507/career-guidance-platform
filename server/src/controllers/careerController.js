import Career from '../models/Career.js';
import User from '../models/User.js';
import { getRecommendations } from '../services/careerRecommendationService.js';

// @desc    Get career recommendations for current user
// @route   GET /api/careers/recommend
// @access  Private
export const getCareerRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);
    const recommendations = await getRecommendations(user, limit);
    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all careers (list)
// @route   GET /api/careers
// @access  Public
export const getAllCareers = async (req, res, next) => {
  try {
    const careers = await Career.find({ isActive: true }).select('career_name slug description average_salary industry_demand').lean();
    res.json({ success: true, careers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single career by slug
// @route   GET /api/careers/:slug
// @access  Public
export const getCareerBySlug = async (req, res, next) => {
  try {
    const career = await Career.findOne({ slug: req.params.slug, isActive: true });
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    res.json({ success: true, career });
  } catch (error) {
    next(error);
  }
};

// @desc    Get roadmap for a career
// @route   GET /api/roadmap/:career
// @access  Public
export const getRoadmap = async (req, res, next) => {
  try {
    const slug = req.params.career;
    const career = await Career.findOne({
      $or: [{ slug }, { career_name: new RegExp(slug, 'i') }],
      isActive: true,
    });
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    const steps = career.roadmap_steps && career.roadmap_steps.length
      ? career.roadmap_steps
      : ['Research role', 'Learn fundamentals', 'Build projects', 'Practice interviews', 'Apply'];
    res.json({
      success: true,
      career: career.career_name,
      slug: career.slug,
      steps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare two careers
// @route   GET /api/careers/compare?career1=&career2=
// @access  Public
export const compareCareers = async (req, res, next) => {
  try {
    const { career1, career2 } = req.query;
    if (!career1 || !career2) {
      return res.status(400).json({ success: false, message: 'career1 and career2 query params required' });
    }
    const slug1 = career1.toLowerCase().replace(/\s+/g, '-');
    const slug2 = career2.toLowerCase().replace(/\s+/g, '-');
    const [c1, c2] = await Promise.all([
      Career.findOne({ $or: [{ slug: slug1 }, { career_name: new RegExp(career1, 'i') }], isActive: true }).lean(),
      Career.findOne({ $or: [{ slug: slug2 }, { career_name: new RegExp(career2, 'i') }], isActive: true }).lean(),
    ]);
    if (!c1 || !c2) {
      return res.status(404).json({ success: false, message: 'One or both careers not found' });
    }
    res.json({
      success: true,
      compare: [
        { field: 'Career', value1: c1.career_name, value2: c2.career_name },
        { field: 'Average Salary', value1: c1.average_salary, value2: c2.average_salary },
        { field: 'Demand', value1: c1.industry_demand, value2: c2.industry_demand },
        { field: 'Difficulty', value1: c1.difficulty, value2: c2.difficulty },
        { field: 'Growth', value1: c1.growth_potential, value2: c2.growth_potential },
        { field: 'Skills', value1: (c1.required_skills || []).join(', '), value2: (c2.required_skills || []).join(', ') },
      ],
      career1: c1,
      career2: c2,
    });
  } catch (error) {
    next(error);
  }
};
