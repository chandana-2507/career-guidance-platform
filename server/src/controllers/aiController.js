import mongoose from 'mongoose';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import UserCareerProfile from '../models/UserCareerProfile.js';
import User from '../models/User.js';
import {
  buildSessionTitle,
  extractProfileInsights,
  generateChatResponse,
  getMaxMessageLength,
} from '../services/aiService.js';
import { createAiError, logAiError, toUserFacingAiMessage } from '../utils/aiErrors.js';

function validateObjectId(id, label = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
}

async function getOrCreateProfile(userId) {
  let profile = await UserCareerProfile.findOne({ userId });
  if (profile) return profile;

  const user = await User.findById(userId).select(
    'college degree skills interests careerGoals careerGoal',
  );

  profile = await UserCareerProfile.create({
    userId,
    education: [user?.degree, user?.college].filter(Boolean).join(' at '),
    interests: user?.interests || [],
    skills: user?.skills || [],
    goals: user?.careerGoals || user?.careerGoal || '',
    lastUpdated: new Date(),
  });

  return profile;
}

function serializeProfile(profile) {
  return {
    education: profile.education,
    interests: profile.interests,
    skills: profile.skills,
    strengths: profile.strengths,
    goals: profile.goals,
    preferredIndustries: profile.preferredIndustries,
    recommendedCareers: profile.recommendedCareers,
    lastUpdated: profile.lastUpdated,
  };
}

function handleAiFailure(error, res, next) {
  if (error?.isAiError || error?.name === 'ApiError' || error?.name === 'AiServiceError') {
    const aiError = error?.isAiError ? error : createAiError(error);
    logAiError('chat request failed', aiError.cause || error);
    return res.status(aiError.statusCode || 503).json({
      success: false,
      message: aiError.userMessage || toUserFacingAiMessage(error),
    });
  }
  return next(error);
}

// @desc    Send chat message to CareerPilot AI
// @route   POST /api/ai/chat
// @access  Private
export const sendChatMessage = async (req, res, next) => {
  let createdSession = null;

  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > getMaxMessageLength()) {
      return res.status(400).json({
        success: false,
        message: `Message must be at most ${getMaxMessageLength()} characters`,
      });
    }

    let session;
    if (sessionId) {
      validateObjectId(sessionId, 'session ID');
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Chat session not found' });
      }
    } else {
      session = await ChatSession.create({
        userId: req.user.id,
        title: buildSessionTitle(trimmedMessage),
      });
      createdSession = session;
    }

    const previousMessages = await ChatMessage.find({ sessionId: session._id })
      .sort({ timestamp: 1 })
      .select('role content');

    const profile = await getOrCreateProfile(req.user.id);
    const user = await User.findById(req.user.id).select(
      'name college degree skills interests careerGoals careerGoal',
    );

    const assistantReply = await generateChatResponse({
      message: trimmedMessage,
      history: previousMessages,
      profile,
      user,
    });

    const now = new Date();
    await ChatMessage.insertMany([
      {
        sessionId: session._id,
        userId: req.user.id,
        role: 'user',
        content: trimmedMessage,
        timestamp: now,
      },
      {
        sessionId: session._id,
        userId: req.user.id,
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date(now.getTime() + 1),
      },
    ]);

    if (session.title === 'New conversation') {
      session.title = buildSessionTitle(trimmedMessage);
    }
    session.updatedAt = new Date();
    await session.save();

    const insights = await extractProfileInsights({
      userMessage: trimmedMessage,
      assistantMessage: assistantReply,
      currentProfile: serializeProfile(profile),
    });

    if (insights) {
      Object.assign(profile, insights, { lastUpdated: new Date() });
      await profile.save();
    }

    res.json({
      success: true,
      sessionId: session._id,
      sessionTitle: session.title,
      message: trimmedMessage,
      response: assistantReply,
      profile: serializeProfile(profile),
    });
  } catch (error) {
    if (createdSession) {
      await ChatMessage.deleteMany({ sessionId: createdSession._id }).catch(() => {});
      await createdSession.deleteOne().catch(() => {});
    }
    return handleAiFailure(error, res, next);
  }
};

// @desc    List chat sessions
// @route   GET /api/ai/sessions
// @access  Private
export const listSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session with messages
// @route   GET /api/ai/session/:id
// @access  Private
export const getSession = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'session ID');

    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    const messages = await ChatMessage.find({ sessionId: session._id })
      .sort({ timestamp: 1 })
      .select('role content timestamp');

    res.json({
      success: true,
      session: {
        _id: session._id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat session
// @route   DELETE /api/ai/session/:id
// @access  Private
export const deleteSession = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'session ID');

    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Chat session not found' });
    }

    await ChatMessage.deleteMany({ sessionId: session._id });
    await session.deleteOne();

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI career profile
// @route   GET /api/ai/profile
// @access  Private
export const getAiProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user.id);
    res.json({ success: true, profile: serializeProfile(profile) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update AI career profile
// @route   PUT /api/ai/profile
// @access  Private
export const updateAiProfile = async (req, res, next) => {
  try {
    const allowed = [
      'education',
      'interests',
      'skills',
      'strengths',
      'goals',
      'preferredIndustries',
      'recommendedCareers',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No valid profile fields provided' });
    }

    const profile = await getOrCreateProfile(req.user.id);
    Object.assign(profile, updates, { lastUpdated: new Date() });
    await profile.save();

    res.json({ success: true, profile: serializeProfile(profile) });
  } catch (error) {
    next(error);
  }
};
