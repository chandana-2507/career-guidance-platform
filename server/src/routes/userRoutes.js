import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/users - Create a user
router.post('/', async (req, res, next) => {
  try {
    const { name, email, skills = [], interests = [], careerGoal = '' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    const user = await User.create({
      name,
      email,
      skills: Array.isArray(skills) ? skills : [skills],
      interests: Array.isArray(interests) ? interests : [interests],
      careerGoal,
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// GET /api/users - Return all users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

export default router;
