import express from 'express';
import { getSkillGap } from '../controllers/skillGapController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/gap/:career', protect, getSkillGap);

export default router;
