import express from 'express';
import {
  deleteSession,
  getAiProfile,
  getSession,
  listSessions,
  sendChatMessage,
  updateAiProfile,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiChatRateLimiter, aiProfileRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/chat', aiChatRateLimiter, sendChatMessage);
router.get('/sessions', aiProfileRateLimiter, listSessions);
router.get('/session/:id', aiProfileRateLimiter, getSession);
router.delete('/session/:id', aiProfileRateLimiter, deleteSession);
router.get('/profile', aiProfileRateLimiter, getAiProfile);
router.put('/profile', aiProfileRateLimiter, updateAiProfile);

export default router;
