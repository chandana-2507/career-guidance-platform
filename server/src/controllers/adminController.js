import User from '../models/User.js';
import Career from '../models/Career.js';
import Internship from '../models/Internship.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all careers (admin - include inactive)
// @route   GET /api/admin/careers
// @access  Private/Admin
export const getCareersAdmin = async (req, res, next) => {
  try {
    const careers = await Career.find().sort({ career_name: 1 }).lean();
    res.json({ success: true, careers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create career
// @route   POST /api/admin/careers
// @access  Private/Admin
export const createCareer = async (req, res, next) => {
  try {
    const career = await Career.create(req.body);
    res.status(201).json({ success: true, career });
  } catch (error) {
    next(error);
  }
};

// @desc    Update career
// @route   PUT /api/admin/careers/:id
// @access  Private/Admin
export const updateCareer = async (req, res, next) => {
  try {
    const career = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!career) return res.status(404).json({ success: false, message: 'Career not found' });
    res.json({ success: true, career });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs (admin)
// @route   GET /api/admin/jobs
// @access  Private/Admin
export const getJobsAdmin = async (req, res, next) => {
  try {
    const jobs = await Internship.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Create job
// @route   POST /api/admin/jobs
// @access  Private/Admin
export const createJob = async (req, res, next) => {
  try {
    const job = await Internship.create(req.body);
    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (admin)
// @route   GET /api/admin/projects
// @access  Private/Admin
export const getProjectsAdmin = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/admin/projects
// @access  Private/Admin
export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all skills (admin)
// @route   GET /api/admin/skills
// @access  Private/Admin
export const getSkillsAdmin = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ name: 1 }).limit(500).lean();
    res.json({ success: true, skills });
  } catch (error) {
    next(error);
  }
};

// @desc    Create skill
// @route   POST /api/admin/skills
// @access  Private/Admin
export const createSkill = async (req, res, next) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, skill });
  } catch (error) {
    next(error);
  }
};
