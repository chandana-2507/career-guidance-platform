import UserCareerProfile from '../models/UserCareerProfile.js';
import CareerRecommendationCache from '../models/CareerRecommendationCache.js';
import InternshipCache from '../models/InternshipCache.js';
import ProjectCache from '../models/ProjectCache.js';
import AnalyticsCache from '../models/AnalyticsCache.js';
import SkillGapCache from '../models/SkillGapCache.js';
import { buildProfileFingerprint } from '../utils/profileFingerprint.js';

export async function getProfileVersion(userId) {
  const profile = await UserCareerProfile.findOne({ userId }).select('profileVersion');
  return profile?.profileVersion ?? 0;
}

export async function incrementProfileVersion(userId) {
  const profile = await UserCareerProfile.findOneAndUpdate(
    { userId },
    {
      $inc: { profileVersion: 1 },
      $set: { lastUpdated: new Date() },
      $push: {
        profileUpdateHistory: {
          $each: [new Date()],
          $slice: -20,
        },
      },
    },
    { upsert: true, new: true },
  );
  return profile.profileVersion;
}

export async function invalidateCachesForProfileChange(userId, { invalidateResume = false } = {}) {
  await Promise.all([
    CareerRecommendationCache.deleteOne({ userId }),
    InternshipCache.deleteMany({ userId }),
    ProjectCache.deleteMany({ userId }),
    SkillGapCache.deleteMany({ userId }),
    AnalyticsCache.deleteOne({ userId }),
  ]);

  if (invalidateResume) {
    // Resume change invalidates recommendations via fingerprint; analyses kept by hash
  }
}

export async function getProfileHash(profile, user) {
  return buildProfileFingerprint(profile, user);
}
