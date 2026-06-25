import Project from '../models/Project.js';

// @desc    Get project recommendations for a career
// @route   GET /api/projects/:career
// @access  Public
export const getProjectsByCareer = async (req, res, next) => {
  try {
    const career = req.params.career;
    const slug = career.toLowerCase().replace(/\s+/g, '-');
    const projects = await Project.find({
      isActive: true,
      $or: [{ careerSlug: slug }, { career: new RegExp(career, 'i') }],
    })
      .limit(20)
      .lean();
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};
