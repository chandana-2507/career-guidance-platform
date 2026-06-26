import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, profile: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile/update
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name',
      'college',
      'degree',
      'skills',
      'interests',
      'careerGoals',
      'resumeUrl',
      'resumePublicId',
      'linkedinUrl',
      'githubUrl',
      'portfolioLinks',
      'careerInterests',
      'preferredIndustry',
      'preferredRole',
      'branch',
      'certifications',
      'projects',
      'experience',
      'avatar',
    ];
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) updates[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select(
      '-password',
    );

    const { syncUserToAiProfile } = await import('../services/profileSyncService.js');
    await syncUserToAiProfile(req.user.id);

    res.json({
      success: true,
      profile: user,
      message: 'Profile updated. Career recommendations will refresh automatically.',
    });
  } catch (error) {
    next(error);
  }
};
