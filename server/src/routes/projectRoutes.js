import express from 'express';
import { getProjectsByCareer } from '../controllers/projectController.js';

const router = express.Router();

router.get('/:career', getProjectsByCareer);

export default router;
