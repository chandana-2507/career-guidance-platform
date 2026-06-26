import mongoose from 'mongoose';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import UserCareerProfile from '../models/UserCareerProfile.js';
import User from '../models/User.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import CareerRecommendationCache from '../models/CareerRecommendationCache.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import InternshipCache from '../models/InternshipCache.js';
import ProjectCache from '../models/ProjectCache.js';
import AnalyticsCache from '../models/AnalyticsCache.js';
import CareerComparisonCache from '../models/CareerComparisonCache.js';
import SkillGapCache from '../models/SkillGapCache.js';
import {
  analyzeResumeWithAi,
  buildSessionTitle,
  compareCareersWithAi,
  extractProfileInsights,
  generateCareerRecommendations,
  generateChatResponse,
  generateDetailedRoadmap,
  generateInternshipRecommendations,
  generateProjectIdeas,
  generateSkillGapAnalysis,
  getMaxMessageLength,
  isProfileSufficientForRecommendations,
} from '../services/aiService.js';
import { extractResumeText } from '../utils/resumeTextExtractor.js';
import { createAiError, logAiError, toUserFacingAiMessage } from '../utils/aiErrors.js';
import {
  buildProfileFingerprint,
  buildResumeContentHash,
  calculateProfileCompletion,
} from '../utils/profileFingerprint.js';
import { invalidateCachesForProfileChange } from '../services/cacheSyncService.js';
import { computeAnalyticsMetrics, generateAnalyticsInsights } from '../services/analytics.service.js';
import { logAiCacheHit, logAiCacheMiss } from '../utils/aiMonitoring.js';

/** Prevent duplicate Gemini calls when React StrictMode double-mounts in dev */
const inflightRecommendations = new Map();

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
    'college degree branch skills interests careerGoals careerGoal certifications projects experience',
  );

  profile = await UserCareerProfile.create({
    userId,
    education: [user?.degree, user?.branch, user?.college].filter(Boolean).join(' — '),
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
    preferredRole: profile.preferredRole,
    recommendedCareers: profile.recommendedCareers,
    resumeInsights: profile.resumeInsights,
    lastChatSummary: profile.lastChatSummary,
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
      const userForFingerprint = await User.findById(req.user.id).select(
        'college degree branch skills interests careerGoals careerGoal preferredIndustry preferredRole careerInterests certifications projects experience',
      );
      const oldFingerprint = buildProfileFingerprint(profile, userForFingerprint);

      Object.assign(profile, insights, { lastUpdated: new Date() });
      await profile.save();

      const newFingerprint = buildProfileFingerprint(profile, userForFingerprint);
      if (oldFingerprint !== newFingerprint) {
        await invalidateCachesForProfileChange(req.user.id);
      }
    }

    profile.lastChatSummary = assistantReply.slice(0, 500);
    profile.lastUpdated = new Date();
    await profile.save();

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

async function loadUserContext(userId) {
  const [profile, user] = await Promise.all([
    getOrCreateProfile(userId),
    User.findById(userId).select(
      'name college degree branch skills interests careerGoals careerGoal careerInterests preferredIndustry preferredRole certifications projects experience portfolioLinks',
    ),
  ]);
  const fingerprint = buildProfileFingerprint(profile, user);
  return {
    profile,
    user,
    fingerprint,
    profileVersion: profile.profileVersion ?? 0,
  };
}

// @desc    Get AI-powered career recommendations
// @route   GET /api/ai/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    const { profile, user, fingerprint, profileVersion } = await loadUserContext(req.user.id);
    const forceRegenerate = req.method === 'POST';

    if (!isProfileSufficientForRecommendations(profile, user)) {
      return res.json({
        success: true,
        sufficient: false,
        message: 'Complete your profile to receive personalized recommendations.',
        recommendations: [],
        profileCompletion: calculateProfileCompletion(profile, user),
        profileVersion,
      });
    }

    if (!forceRegenerate) {
      const cached = await CareerRecommendationCache.findOne({ userId: req.user.id });
      const hashMatch =
        cached &&
        (cached.profileFingerprint === fingerprint || cached.profileHash === fingerprint) &&
        cached.recommendations?.length;

      if (hashMatch) {
        logAiCacheHit('recommend', { userId: req.user.id, cacheType: 'recommendations' });
        return res.json({
          success: true,
          sufficient: true,
          cached: true,
          recommendations: cached.recommendations,
          profileCompletion: calculateProfileCompletion(profile, user),
          generatedAt: cached.generatedAt,
          profileVersion: cached.profileVersion ?? profileVersion,
          profileHash: fingerprint,
        });
      }
    }

    const dedupeKey = `recommend:${req.user.id}:${fingerprint}:${forceRegenerate ? 'refresh' : 'generate'}`;
    if (inflightRecommendations.has(dedupeKey)) {
      const payload = await inflightRecommendations.get(dedupeKey);
      return res.json(payload);
    }

    const generationPromise = (async () => {
      logAiCacheMiss('recommend', {
        userId: req.user.id,
        cacheType: 'recommendations',
        reason: forceRegenerate ? 'forced refresh' : 'profile changed or no cache',
      });

      const recommendations = await generateCareerRecommendations({ profile, user });
      const generatedAt = new Date();

      const existing = await CareerRecommendationCache.findOne({ userId: req.user.id });
      const historyEntry = {
        recommendations,
        generatedAt,
        profileFingerprint: fingerprint,
        profileVersion,
      };
      const history = [...(existing?.history || []), historyEntry].slice(-10);

      await CareerRecommendationCache.findOneAndUpdate(
        { userId: req.user.id },
        {
          profileFingerprint: fingerprint,
          profileHash: fingerprint,
          profileVersion,
          recommendations,
          generatedAt,
          lastUpdated: generatedAt,
          history,
        },
        { upsert: true },
      );

      profile.recommendedCareers = recommendations.map((r) => r.title);
      profile.lastUpdated = new Date();
      await profile.save();

      return {
        success: true,
        sufficient: true,
        cached: false,
        recommendations,
        profileCompletion: calculateProfileCompletion(profile, user),
        generatedAt,
        profileVersion,
        profileHash: fingerprint,
      };
    })();

    inflightRecommendations.set(dedupeKey, generationPromise);
    try {
      const payload = await generationPromise;
      res.json(payload);
    } finally {
      inflightRecommendations.delete(dedupeKey);
    }
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

// @desc    Regenerate AI career recommendations
// @route   POST /api/ai/recommendations
// @access  Private
export const regenerateRecommendations = async (req, res, next) => {
  return getRecommendations(req, res, next);
};

function serializeResumeAnalysis(analysis) {
  const raw = analysis.rawAnalysis || {};
  return {
    id: analysis._id,
    fileName: analysis.fileName,
    overallScore: analysis.overallScore ?? analysis.score,
    summary: analysis.summary,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    missingSkills: analysis.missingSkills || analysis.missingKeywords || [],
    atsScore: analysis.atsScore,
    careerSuggestions: analysis.careerSuggestions || [],
    recommendedCertifications: analysis.recommendedCertifications || [],
    improvementSuggestions: analysis.improvementSuggestions || analysis.suggestions || [],
    formattingIssues: raw.formattingIssues || [],
    grammarSuggestions: raw.grammarSuggestions || [],
    suggestedProjects: raw.suggestedProjects || [],
    improvedSummary: raw.improvedSummary || '',
    keywordAnalysis: raw.keywordAnalysis || [],
    careerFit: raw.careerFit || '',
    missingCertifications: raw.missingCertifications || [],
    missingProjects: raw.missingProjects || [],
    interviewReadiness: raw.interviewReadiness || '',
    cached: false,
    createdAt: analysis.createdAt,
  };
}

// @desc    Analyze uploaded resume with AI
// @route   POST /api/ai/analyze-resume
// @access  Private
export const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }

    const resumeText = await extractResumeText(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    const resumeHash = buildResumeContentHash(resumeText);

    const existingAnalysis = await ResumeAnalysis.findOne({
      user: req.user.id,
      resumeHash,
    }).sort({ createdAt: -1 });

    if (existingAnalysis) {
      logAiCacheHit('resume', { userId: req.user.id, cacheType: 'resume', detail: { resumeHash } });
      return res.json({
        success: true,
        cached: true,
        analysis: { ...serializeResumeAnalysis(existingAnalysis), cached: true },
      });
    }

    const user = await User.findById(req.user.id).select(
      'name skills interests careerGoals careerGoal degree branch',
    );

    const analysisResult = await analyzeResumeWithAi({ resumeText, user });

    const resumeInsights = {
      overallScore: analysisResult.overallScore,
      atsScore: analysisResult.atsScore,
      summary: analysisResult.summary,
      strengths: analysisResult.strengths,
      missingSkills: analysisResult.missingSkills,
      careerSuggestions: analysisResult.careerSuggestions,
      resumeHash,
      analyzedAt: new Date().toISOString(),
    };

    const saved = await ResumeAnalysis.create({
      user: req.user.id,
      fileName: req.file.originalname,
      resumeHash,
      score: analysisResult.overallScore,
      overallScore: analysisResult.overallScore,
      summary: analysisResult.summary,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      missingSkills: analysisResult.missingSkills,
      missingKeywords: analysisResult.missingSkills,
      atsScore: analysisResult.atsScore,
      careerSuggestions: analysisResult.careerSuggestions,
      recommendedCertifications: analysisResult.recommendedCertifications,
      improvementSuggestions: analysisResult.improvementSuggestions,
      suggestions: analysisResult.improvementSuggestions,
      rawAnalysis: analysisResult,
    });

    await invalidateCachesForProfileChange(req.user.id, { invalidateResume: true });

    await UserCareerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { resumeInsights, lastUpdated: new Date() },
      { upsert: true },
    );

    res.status(201).json({
      success: true,
      cached: false,
      analysis: serializeResumeAnalysis(saved),
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return handleAiFailure(error, res, next);
  }
};

// @desc    List previous resume analyses
// @route   GET /api/ai/resume-analyses
// @access  Private
export const listResumeAnalyses = async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      analyses: analyses.map(serializeResumeAnalysis),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI roadmap for a career
// @route   GET /api/ai/roadmap/:career
// @access  Private
export const getAiRoadmap = async (req, res, next) => {
  try {
    const career = decodeURIComponent(req.params.career || '').trim();
    if (!career) {
      return res.status(400).json({ success: false, message: 'Career is required' });
    }

    const { profile, user, fingerprint } = await loadUserContext(req.user.id);
    let progress = await RoadmapProgress.findOne({ userId: req.user.id, careerTitle: career });
    let cached = true;

    if (!progress || progress.profileFingerprint !== fingerprint) {
      cached = false;
      const roadmap = await generateDetailedRoadmap({ career, profile, user });
      progress = await RoadmapProgress.findOneAndUpdate(
        { userId: req.user.id, careerTitle: career },
        {
          roadmap,
          profileFingerprint: fingerprint,
          generatedAt: new Date(),
          completedItems: progress?.completedItems || [],
        },
        { upsert: true, new: true },
      );

      await UserCareerProfile.findOneAndUpdate(
        { userId: req.user.id },
        {
          $push: {
            previousRoadmaps: {
              $each: [{ careerTitle: career, generatedAt: new Date() }],
              $slice: -10,
            },
          },
          lastUpdated: new Date(),
        },
      );
    }

    const totalItems = countRoadmapItems(progress.roadmap);
    const completed = progress.completedItems?.length || 0;
    const progressPercent = totalItems
      ? Math.round((completed / totalItems) * 100)
      : progress.progressPercent || 0;

    res.json({
      success: true,
      career,
      cached,
      roadmap: progress.roadmap,
      completedItems: progress.completedItems || [],
      progressPercent,
      generatedAt: progress.generatedAt,
    });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

function countRoadmapItems(roadmap) {
  if (!roadmap?.levels) return 0;
  let count = 0;
  for (const level of Object.values(roadmap.levels)) {
    for (const key of ['skills', 'courses', 'projects', 'books', 'certifications', 'practicePlatforms', 'interviewPrep']) {
      count += level?.[key]?.length || 0;
    }
  }
  return count;
}

// @desc    Update roadmap progress
// @route   PUT /api/ai/roadmap/:career/progress
// @access  Private
export const updateRoadmapProgress = async (req, res, next) => {
  try {
    const career = decodeURIComponent(req.params.career || '').trim();
    const { completedItems } = req.body;
    if (!Array.isArray(completedItems)) {
      return res.status(400).json({ success: false, message: 'completedItems array is required' });
    }

    const progress = await RoadmapProgress.findOneAndUpdate(
      { userId: req.user.id, careerTitle: career },
      { completedItems, progressPercent: req.body.progressPercent ?? 0 },
      { new: true },
    );

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    res.json({ success: true, completedItems: progress.completedItems, progressPercent: progress.progressPercent });
  } catch (error) {
    next(error);
  }
};

// @desc    AI skill gap analysis
// @route   GET /api/ai/skill-gap/:career
// @access  Private
export const getAiSkillGap = async (req, res, next) => {
  try {
    const career = decodeURIComponent(req.params.career || '').trim();
    const { profile, user, fingerprint } = await loadUserContext(req.user.id);

    const cached = await SkillGapCache.findOne({
      userId: req.user.id,
      career,
      profileHash: fingerprint,
    });

    if (cached?.result) {
      logAiCacheHit('roadmap', { userId: req.user.id, cacheType: 'skill-gap', detail: { career } });
      return res.json({ success: true, cached: true, ...cached.result });
    }

    const analysis = await generateSkillGapAnalysis({ career, profile, user });

    await SkillGapCache.findOneAndUpdate(
      { userId: req.user.id, career },
      { profileHash: fingerprint, result: analysis, generatedAt: new Date() },
      { upsert: true },
    );

    res.json({ success: true, cached: false, ...analysis });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

// @desc    AI career comparison
// @route   POST /api/ai/compare
// @access  Private
export const compareCareersAi = async (req, res, next) => {
  try {
    const { careerA, careerB } = req.body;
    if (!careerA || !careerB) {
      return res.status(400).json({ success: false, message: 'careerA and careerB are required' });
    }
    const trimmedA = careerA.trim();
    const trimmedB = careerB.trim();
    const [normA, normB] = [trimmedA, trimmedB].sort((a, b) => a.localeCompare(b));
    const { profile, user, fingerprint } = await loadUserContext(req.user.id);

    const cached = await CareerComparisonCache.findOne({
      userId: req.user.id,
      careerA: normA,
      careerB: normB,
      profileHash: fingerprint,
    });

    if (cached?.result) {
      logAiCacheHit('compare', {
        userId: req.user.id,
        cacheType: 'comparison',
        detail: { careerA: normA, careerB: normB },
      });
      return res.json({ success: true, cached: true, ...cached.result });
    }

    const comparison = await compareCareersWithAi({
      careerA: trimmedA,
      careerB: trimmedB,
      profile,
      user,
    });

    await CareerComparisonCache.findOneAndUpdate(
      { userId: req.user.id, careerA: normA, careerB: normB },
      { profileHash: fingerprint, result: comparison, generatedAt: new Date() },
      { upsert: true },
    );

    res.json({ success: true, cached: false, ...comparison });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

// @desc    AI internship recommendations
// @route   GET /api/ai/internships
// @access  Private
export const getAiInternships = async (req, res, next) => {
  try {
    const career = (req.query.career || '').trim();
    const { profile, user, fingerprint, profileVersion } = await loadUserContext(req.user.id);

    const cached = await InternshipCache.findOne({
      userId: req.user.id,
      career,
      profileHash: fingerprint,
    });

    if (cached?.data) {
      logAiCacheHit('internship', { userId: req.user.id, cacheType: 'internships', detail: { career } });
      return res.json({ success: true, cached: true, ...cached.data });
    }

    const result = await generateInternshipRecommendations({ career, profile, user });

    await InternshipCache.findOneAndUpdate(
      { userId: req.user.id, career },
      {
        profileHash: fingerprint,
        profileVersion,
        data: result,
        generatedAt: new Date(),
      },
      { upsert: true },
    );

    res.json({ success: true, cached: false, ...result });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

// @desc    AI project ideas
// @route   GET /api/ai/projects
// @access  Private
export const getAiProjects = async (req, res, next) => {
  try {
    const career = (req.query.career || '').trim();
    const difficulty = req.query.difficulty || 'intermediate';
    const { profile, user, fingerprint, profileVersion } = await loadUserContext(req.user.id);

    const cached = await ProjectCache.findOne({
      userId: req.user.id,
      career,
      difficulty,
      profileHash: fingerprint,
    });

    if (cached?.data) {
      logAiCacheHit('project', { userId: req.user.id, cacheType: 'projects', detail: { career, difficulty } });
      return res.json({ success: true, cached: true, ...cached.data });
    }

    const result = await generateProjectIdeas({ career, profile, user, difficulty });

    await ProjectCache.findOneAndUpdate(
      { userId: req.user.id, career, difficulty },
      {
        profileHash: fingerprint,
        profileVersion,
        data: result,
        generatedAt: new Date(),
      },
      { upsert: true },
    );

    res.json({ success: true, cached: false, ...result });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};

// @desc    Dashboard summary
// @route   GET /api/ai/dashboard
// @access  Private
export const getDashboard = async (req, res, next) => {
  try {
    const { profile, user, fingerprint } = await loadUserContext(req.user.id);
    const [cachedRecs, latestResume, latestSession, latestMessage, roadmapProgressList, internshipCache, projectCache] =
      await Promise.all([
      CareerRecommendationCache.findOne({ userId: req.user.id }),
      ResumeAnalysis.findOne({ user: req.user.id }).sort({ createdAt: -1 }),
      ChatSession.findOne({ userId: req.user.id }).sort({ updatedAt: -1 }),
      ChatMessage.findOne({ userId: req.user.id, role: 'assistant' }).sort({ timestamp: -1 }),
      RoadmapProgress.find({ userId: req.user.id }).select('progressPercent careerTitle roadmap'),
      InternshipCache.findOne({ userId: req.user.id, profileHash: fingerprint }).sort({ generatedAt: -1 }),
      ProjectCache.findOne({ userId: req.user.id, profileHash: fingerprint }).sort({ generatedAt: -1 }),
    ]);

    const profileCompletion = calculateProfileCompletion(profile, user);
    const topRecommendation = cachedRecs?.recommendations?.[0] || null;
    const topMissingSkills = topRecommendation?.missingSkills?.slice(0, 5) || [];
    const careerReadiness = topRecommendation?.matchScore ?? 0;

    const roadmapAvgProgress = roadmapProgressList.length
      ? Math.round(
          roadmapProgressList.reduce((sum, r) => sum + (r.progressPercent || 0), 0) /
            roadmapProgressList.length,
        )
      : 0;

    const upcomingMilestones = roadmapProgressList
      .flatMap((r) => {
        const weeks = r.roadmap?.weekMilestones || [];
        return weeks.slice(0, 2).map((w) => ({
          career: r.careerTitle,
          milestone: w.week || w.month || 'Upcoming',
          tasks: w.tasks || [],
        }));
      })
      .slice(0, 3);

    const internshipSuggestions = (internshipCache?.data?.internships || []).slice(0, 3);
    const projectSuggestions = (projectCache?.data?.projects || []).slice(0, 3);

    let recommendedNextAction = 'Complete your profile to unlock personalized guidance.';
    if (profileCompletion < 70) {
      recommendedNextAction = 'Add education, skills, and career goals in your profile.';
    } else if (!latestResume) {
      recommendedNextAction = 'Upload your resume for AI feedback and stronger recommendations.';
    } else if (!topRecommendation || cachedRecs?.profileFingerprint !== fingerprint) {
      recommendedNextAction = 'Open Career Recommendations to generate paths for your updated profile.';
    } else if (topMissingSkills.length) {
      recommendedNextAction = `Focus on learning: ${topMissingSkills.slice(0, 2).join(', ')}.`;
    } else {
      recommendedNextAction = 'Explore your roadmap and build a portfolio project.';
    }

    const recentActivity = [];
    if (latestResume) {
      recentActivity.push({
        type: 'resume',
        title: `Resume analyzed (${latestResume.overallScore ?? latestResume.score}/100)`,
        date: latestResume.createdAt,
      });
    }
    if (latestSession) {
      recentActivity.push({
        type: 'chat',
        title: latestSession.title,
        date: latestSession.updatedAt,
      });
    }
    if (cachedRecs?.generatedAt) {
      recentActivity.push({
        type: 'recommendations',
        title: 'Career recommendations updated',
        date: cachedRecs.generatedAt,
      });
    }

    res.json({
      success: true,
      profileCompletion,
      careerReadiness,
      careerMatchPercent: topRecommendation?.matchScore ?? null,
      latestRecommendation: topRecommendation,
      latestRecommendations: cachedRecs?.recommendations?.slice(0, 3) || [],
      latestResumeScore: latestResume?.overallScore ?? latestResume?.score ?? null,
      latestAtsScore: latestResume?.atsScore ?? null,
      topMissingSkills,
      skillGapSummary: topMissingSkills.length
        ? `Focus on ${topMissingSkills.slice(0, 3).join(', ')}`
        : null,
      recommendedNextAction,
      learningProgress: Math.max(roadmapAvgProgress, profileCompletion),
      roadmapProgress: roadmapAvgProgress,
      activeRoadmaps: roadmapProgressList.map((r) => ({
        career: r.careerTitle,
        progressPercent: r.progressPercent,
      })),
      upcomingMilestones,
      internshipSuggestions,
      projectSuggestions,
      latestChatSummary: profile.lastChatSummary || latestMessage?.content?.slice(0, 160) || null,
      latestChatSession: latestSession?.title || null,
      recentChat: latestSession
        ? { title: latestSession.title, updatedAt: latestSession.updatedAt }
        : null,
      recentActivity: recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

function mergeUniqueArrays(a = [], b = []) {
  return [...new Set([...a, ...b].map((s) => String(s).trim()).filter(Boolean))];
}

// @desc    User analytics
// @route   GET /api/ai/analytics
// @access  Private
export const getUserAnalytics = async (req, res, next) => {
  try {
    const { profile, user, fingerprint, profileVersion } = await loadUserContext(req.user.id);
    const profileCompletion = calculateProfileCompletion(profile, user);

    const [cachedRecs, resumeHistory, sessions, roadmapProgressList, analyticsCache] =
      await Promise.all([
        CareerRecommendationCache.findOne({ userId: req.user.id }),
        ResumeAnalysis.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10).lean(),
        ChatSession.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(10),
        RoadmapProgress.find({ userId: req.user.id }).select('progressPercent careerTitle updatedAt'),
        AnalyticsCache.findOne({ userId: req.user.id, profileHash: fingerprint }),
      ]);

    const metrics = computeAnalyticsMetrics({
      profile,
      user,
      cachedRecs,
      latestResume: resumeHistory[0],
      roadmapProgressList,
      profileCompletion,
    });

    if (analyticsCache?.insights) {
      logAiCacheHit('analytics', { userId: req.user.id, cacheType: 'analytics' });
    } else {
      logAiCacheMiss('analytics', { userId: req.user.id, cacheType: 'analytics', reason: 'no cached insights' });
    }

    let insights = analyticsCache?.insights || {};
    if (!analyticsCache?.insights) {
      try {
        insights = await generateAnalyticsInsights({ profile, user, metrics });
        await AnalyticsCache.findOneAndUpdate(
          { userId: req.user.id },
          {
            profileHash: fingerprint,
            profileVersion,
            metrics,
            insights,
            generatedAt: new Date(),
          },
          { upsert: true },
        );
      } catch (error) {
        logAiError('analytics insights skipped', error);
        insights = {
          strengthAreas: profile.strengths || [],
          weakAreas: metrics.missingSkills?.slice(0, 3) || [],
          recommendationsSummary: 'Complete your profile and generate recommendations for detailed insights.',
          missingSkillsHighlight: metrics.missingSkills?.slice(0, 5) || [],
        };
      }
    }

    const skillDistribution = mergeUniqueArrays(user.skills, profile.skills);
    const recommendationHistory = (cachedRecs?.recommendations || []).map((r) => ({
      title: r.title,
      matchScore: r.matchScore,
    }));

    const historyTrend = (cachedRecs?.history || [])
      .flatMap((entry) =>
        (entry.recommendations || []).slice(0, 1).map((r) => ({
          date: entry.generatedAt,
          matchScore: r.matchScore,
          title: r.title,
        })),
      )
      .slice(-10);

    res.json({
      success: true,
      cached: Boolean(analyticsCache?.insights),
      profileCompletion,
      careerReadiness: metrics.careerReadiness,
      skillScore: metrics.skillScore,
      resumeScore: metrics.resumeScore,
      careerMatchScore: metrics.careerMatchScore,
      learningProgress: metrics.learningProgress,
      missingSkills: metrics.missingSkills,
      strengthAreas: insights.strengthAreas || [],
      weakAreas: insights.weakAreas || [],
      recommendationsSummary: insights.recommendationsSummary || '',
      skillDistribution: skillDistribution.map((name) => ({ name, count: 1 })),
      resumeScores: resumeHistory.map((r) => ({
        date: r.createdAt,
        overallScore: r.overallScore ?? r.score,
        atsScore: r.atsScore,
      })),
      roadmapProgress: metrics.roadmapProgress,
      roadmapDetails: roadmapProgressList.map((r) => ({
        career: r.careerTitle,
        progressPercent: r.progressPercent,
      })),
      recommendationHistory,
      recommendationTimeline: historyTrend,
      careerMatchTrend: recommendationHistory.map((r) => r.matchScore),
      chatSessionsCount: sessions.length,
      metrics,
    });
  } catch (error) {
    return handleAiFailure(error, res, next);
  }
};
