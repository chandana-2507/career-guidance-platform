import express from 'express';
import { protect } from '../middleware/auth.js';
import { analyzeResume, listResumeAnalyses } from '../controllers/aiController.js';
import { aiChatRateLimiter, aiProfileRateLimiter } from '../middleware/rateLimiter.js';
import {
  handleResumeUploadError,
  resumeUploadMiddleware,
} from '../middleware/uploadResume.js';

const router = express.Router();

router.use(protect);
router.post(
  '/upload',
  aiChatRateLimiter,
  resumeUploadMiddleware,
  handleResumeUploadError,
  analyzeResume,
);
router.get('/', aiProfileRateLimiter, listResumeAnalyses);
router.get('/analyze', aiProfileRateLimiter, listResumeAnalyses);

export default router;
