import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendChatMessage,
  getRecommendations,
  regenerateRecommendations,
  compareCareersAi,
  analyzeResume,
  listResumeAnalyses,
  getAiInternships,
  getAiProjects,
  getUserAnalytics,
} from '../controllers/aiController.js';
import { aiChatRateLimiter, aiProfileRateLimiter } from '../middleware/rateLimiter.js';
import {
  handleResumeUploadError,
  resumeUploadMiddleware,
} from '../middleware/uploadResume.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiChatRateLimiter, sendChatMessage);
router.get('/recommendations', aiProfileRateLimiter, getRecommendations);
router.post('/recommendations/refresh', aiChatRateLimiter, regenerateRecommendations);
router.post('/compare', aiChatRateLimiter, compareCareersAi);
router.post(
  '/resume/upload',
  aiChatRateLimiter,
  resumeUploadMiddleware,
  handleResumeUploadError,
  analyzeResume,
);
router.get('/resume', aiProfileRateLimiter, listResumeAnalyses);
router.get('/internships', aiChatRateLimiter, getAiInternships);
router.get('/projects', aiChatRateLimiter, getAiProjects);
router.get('/analytics', aiProfileRateLimiter, getUserAnalytics);

export default router;
