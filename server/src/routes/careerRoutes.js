import express from 'express';
import {
  getCareerRecommendations,
  getAllCareers,
  getCareerBySlug,
  getRoadmap,
  compareCareers,
} from '../controllers/careerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/recommend', protect, getCareerRecommendations);
router.get('/compare', compareCareers);
router.get('/', getAllCareers);
router.get('/:slug', getCareerBySlug);

export default router;
