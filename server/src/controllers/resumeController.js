import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { getResumeSuggestions } from '../services/openaiService.js';

function extractTextFromBuffer(buffer) {
  const str = buffer.toString('utf-8', 0, Math.min(buffer.length, 50000));
  return str.replace(/[^\w\s.,\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
}

// @desc    Upload resume (URL already set on profile) and analyze
// @route   POST /api/resume/upload
// @access  Private
export const uploadResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const resumeUrl = req.body.resumeUrl || (req.file && req.file.path);
    if (!resumeUrl && !req.file) {
      return res.status(400).json({ success: false, message: 'Resume URL or file required' });
    }
    let extractedText = '';
    if (req.file && req.file.buffer) {
      extractedText = extractTextFromBuffer(req.file.buffer);
    }
    const targetCareer = user.careerInterests?.[0] || 'general';
    const suggestions = await getResumeSuggestions(extractedText || 'Resume uploaded.', targetCareer);
    const skillsMatch = extractedText ? (extractedText.match(/\b(skill|experience|education|project|javascript|python|react|node|java|sql|communication|leadership)\b/gi) || []).length : 0;
    const score = Math.min(100, 40 + Math.min(30, skillsMatch * 5) + (suggestions.length === 0 ? 30 : Math.max(0, 30 - suggestions.length * 8)));
    const missingKeywords = ['problem solving', 'teamwork', 'leadership', 'communication'].filter(
      (k) => !extractedText.toLowerCase().includes(k)
    ).slice(0, 3);
    const analysis = await ResumeAnalysis.create({
      user: req.user.id,
      resumeUrl: resumeUrl || user.resumeUrl,
      score,
      extractedSkills: extractedText ? [...new Set(extractedText.split(/\s+/).filter((w) => w.length > 4).slice(0, 15))] : [],
      extractedEducation: extractedText ? ['See resume'] : [],
      extractedExperience: extractedText ? ['See resume'] : [],
      suggestions,
      missingKeywords,
      targetCareer,
      rawAnalysis: { textLength: extractedText.length },
    });
    if (resumeUrl) {
      user.resumeUrl = resumeUrl;
      await user.save();
    }
    res.status(201).json({ success: true, analysis: { score, suggestions, missingKeywords, id: analysis._id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest resume analysis for user
// @route   GET /api/resume/analyze
// @access  Private
export const getResumeAnalysis = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'No resume analysis found' });
    }
    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};
