import express from 'express';
import { uploadResume, getResumeAnalysis } from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/upload', uploadResume);
router.get('/analyze', getResumeAnalysis);

export default router;
