import express from 'express';
import { getJobsByCareer } from '../controllers/jobController.js';

const router = express.Router();

router.get('/:career', getJobsByCareer);

export default router;
