import express from 'express';
import { getOverview, getMostDemandedSkills, getMostSelectedCareers } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getOverview);
router.get('/skills', getMostDemandedSkills);
router.get('/careers', getMostSelectedCareers);

export default router;
