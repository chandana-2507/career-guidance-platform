import express from 'express';
import { getRoadmap } from '../controllers/careerController.js';

const router = express.Router();

router.get('/:career', getRoadmap);

export default router;
