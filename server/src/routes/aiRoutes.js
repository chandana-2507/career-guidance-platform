import express from 'express';

import {

  analyzeResume,

  compareCareersAi,

  deleteSession,

  getAiInternships,

  getAiProfile,

  getAiProjects,

  getAiRoadmap,

  getAiSkillGap,

  getDashboard,

  getRecommendations,

  getSession,

  getUserAnalytics,

  listResumeAnalyses,

  listSessions,

  regenerateRecommendations,

  sendChatMessage,

  updateAiProfile,

  updateRoadmapProgress,

} from '../controllers/aiController.js';

import { protect } from '../middleware/auth.js';

import { aiChatRateLimiter, aiProfileRateLimiter } from '../middleware/rateLimiter.js';

import { handleResumeUploadError, resumeUploadMiddleware } from '../middleware/uploadResume.js';



const router = express.Router();



router.use(protect);



router.post('/chat', aiChatRateLimiter, sendChatMessage);

router.get('/sessions', aiProfileRateLimiter, listSessions);

router.get('/session/:id', aiProfileRateLimiter, getSession);

router.delete('/session/:id', aiProfileRateLimiter, deleteSession);

router.get('/profile', aiProfileRateLimiter, getAiProfile);

router.put('/profile', aiProfileRateLimiter, updateAiProfile);

router.get('/recommendations', aiChatRateLimiter, getRecommendations);

router.post('/recommendations', aiChatRateLimiter, regenerateRecommendations);

router.get('/dashboard', aiProfileRateLimiter, getDashboard);

router.get('/analytics', aiProfileRateLimiter, getUserAnalytics);

router.get('/roadmap/:career', aiChatRateLimiter, getAiRoadmap);

router.put('/roadmap/:career/progress', aiProfileRateLimiter, updateRoadmapProgress);

router.get('/skill-gap/:career', aiChatRateLimiter, getAiSkillGap);

router.post('/compare', aiChatRateLimiter, compareCareersAi);

router.get('/internships', aiChatRateLimiter, getAiInternships);

router.get('/projects', aiChatRateLimiter, getAiProjects);

router.post(

  '/analyze-resume',

  aiChatRateLimiter,

  resumeUploadMiddleware,

  handleResumeUploadError,

  analyzeResume,

);

router.get('/resume-analyses', aiProfileRateLimiter, listResumeAnalyses);



export default router;

