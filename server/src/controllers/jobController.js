import Internship from '../models/Internship.js';

// @desc    Get jobs/internships for a career
// @route   GET /api/jobs/:career
// @access  Public
export const getJobsByCareer = async (req, res, next) => {
  try {
    const career = req.params.career;
    const slug = career.toLowerCase().replace(/\s+/g, '-');
    const jobs = await Internship.find({
      isActive: true,
      $or: [{ careerSlug: slug }, { career: new RegExp(career, 'i') }],
    })
      .sort({ postedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};
