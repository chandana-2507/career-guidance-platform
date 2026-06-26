import User from '../models/User.js';
import UserCareerProfile from '../models/UserCareerProfile.js';
import { generateChatResponse } from '../services/aiService.js';
import { createAiError, logAiError, toUserFacingAiMessage } from '../utils/aiErrors.js';

// @desc    Send message to AI career chatbot (legacy route — uses Gemini via CareerPilot AI)
// @route   POST /api/chatbot
// @access  Private
export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const user = await User.findById(req.user.id).select(
      'name college degree branch skills interests careerGoals careerGoal',
    );
    let profile = await UserCareerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = await UserCareerProfile.create({
        userId: req.user.id,
        education: [user?.degree, user?.branch, user?.college].filter(Boolean).join(' — '),
        interests: user?.interests || [],
        skills: user?.skills || [],
        goals: user?.careerGoals || user?.careerGoal || '',
        lastUpdated: new Date(),
      });
    }

    const response = await generateChatResponse({
      message: message.trim(),
      history: [],
      profile,
      user,
    });

    res.json({ success: true, response });
  } catch (error) {
    if (error?.isAiError || error?.name === 'ApiError' || error?.name === 'AiServiceError') {
      const aiError = error?.isAiError ? error : createAiError(error);
      logAiError('legacy chatbot request failed', aiError.cause || error);
      return res.status(aiError.statusCode || 503).json({
        success: false,
        message: aiError.userMessage || toUserFacingAiMessage(error),
      });
    }
    next(error);
  }
};
