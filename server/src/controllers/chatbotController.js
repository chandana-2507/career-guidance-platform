import { getChatbotResponse } from '../services/openaiService.js';
import User from '../models/User.js';

// @desc    Send message to AI career chatbot
// @route   POST /api/chatbot
// @access  Private
export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const user = await User.findById(req.user.id).select('skills interests careerGoals');
    const context = {
      skills: user.skills,
      interests: user.interests,
      careerGoals: user.careerGoals,
    };
    const response = await getChatbotResponse(message.trim(), context);
    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
};
