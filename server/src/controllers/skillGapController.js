import Career from '../models/Career.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';

function normalize(s) {
  return (s || '').toLowerCase().trim();
}

// @desc    Get skill gap for a career
// @route   GET /api/skills/gap/:career
// @access  Private
export const getSkillGap = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const careerSlug = req.params.career;
    const career = await Career.findOne({
      $or: [{ slug: careerSlug }, { career_name: new RegExp(careerSlug, 'i') }],
      isActive: true,
    }).lean();
    if (!career) {
      return res.status(404).json({ success: false, message: 'Career not found' });
    }
    const required = (career.required_skills || []).map(normalize);
    const userSkills = (user.skills || []).map(normalize);
    const userSet = new Set(userSkills);
    const missingSkills = required.filter((s) => !userSet.has(s) && ![...userSet].some((u) => u.includes(s) || s.includes(u)));
    const matchedCount = required.length - missingSkills.length;
    const progressPercent = required.length === 0 ? 100 : Math.round((matchedCount / required.length) * 100);
    const skillDocs = await Skill.find({ name: { $in: missingSkills.map((n) => new RegExp(n, 'i')) }, isActive: true })
      .select('name category learningResources')
      .limit(10)
      .lean();
    const recommendedResources = skillDocs.flatMap((s) => (s.learningResources || []).slice(0, 2));
    res.json({
      success: true,
      career: career.career_name,
      requiredSkills: career.required_skills,
      userSkills: user.skills,
      missingSkills,
      progressPercent,
      recommendedResources: recommendedResources.length ? recommendedResources : [
        { url: 'https://www.coursera.org', title: 'Coursera', type: 'course' },
        { url: 'https://www.udemy.com', title: 'Udemy', type: 'course' },
      ],
    });
  } catch (error) {
    next(error);
  }
};
