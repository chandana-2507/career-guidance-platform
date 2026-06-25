import express from 'express';
import {
  getUsers,
  getCareersAdmin,
  createCareer,
  updateCareer,
  getJobsAdmin,
  createJob,
  getProjectsAdmin,
  createProject,
  getSkillsAdmin,
  createSkill,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, admin);

router.get('/users', getUsers);
router.get('/careers', getCareersAdmin);
router.post('/careers', createCareer);
router.put('/careers/:id', updateCareer);
router.get('/jobs', getJobsAdmin);
router.post('/jobs', createJob);
router.get('/projects', getProjectsAdmin);
router.post('/projects', createProject);
router.get('/skills', getSkillsAdmin);
router.post('/skills', createSkill);

export default router;
