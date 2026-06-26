import User from '../models/User.js';
import UserCareerProfile from '../models/UserCareerProfile.js';
import {
  incrementProfileVersion,
  invalidateCachesForProfileChange,
} from './cacheSyncService.js';

export async function syncUserToAiProfile(userId, { invalidateResume = false } = {}) {
  const user = await User.findById(userId).select(
    'college degree branch skills interests careerGoals careerGoal preferredIndustry preferredRole careerInterests certifications projects experience',
  );
  if (!user) return null;

  const preferredIndustries = user.preferredIndustry ? [user.preferredIndustry] : [];

  const profileVersion = await incrementProfileVersion(userId);

  const profile = await UserCareerProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        education: [user.degree, user.branch, user.college].filter(Boolean).join(' — '),
        interests: user.interests || [],
        skills: user.skills || [],
        goals: user.careerGoals || user.careerGoal || '',
        preferredIndustries,
        preferredRole: user.preferredRole || '',
        profileVersion,
        lastUpdated: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  await invalidateCachesForProfileChange(userId, { invalidateResume });

  return profile;
}

export async function invalidateRecommendationCache(userId) {
  await invalidateCachesForProfileChange(userId);
}
