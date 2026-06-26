export function mergeUnique(existing = [], incoming = []) {
  const set = new Set(existing.map((item) => String(item).toLowerCase()));
  const merged = [...existing];
  for (const item of incoming) {
    const trimmed = String(item).trim();
    if (!trimmed) continue;
    if (!set.has(trimmed.toLowerCase())) {
      set.add(trimmed.toLowerCase());
      merged.push(trimmed);
    }
  }
  return merged;
}

export function mergeProfileData(profile = {}, user = {}) {
  const education =
    profile.education ||
    [user.degree, user.branch, user.college].filter(Boolean).join(' — ') ||
    '';
  const interests = mergeUnique(user.interests, profile.interests);
  const skills = mergeUnique(user.skills, profile.skills);
  const strengths = profile.strengths || [];
  const goals = profile.goals || user.careerGoals || user.careerGoal || '';
  const preferredIndustries = mergeUnique(
    profile.preferredIndustries,
    user.preferredIndustry ? [user.preferredIndustry] : [],
  );

  return {
    name: user.name || 'Student',
    degree: user.degree || '',
    branch: user.branch || '',
    college: user.college || '',
    education,
    interests,
    skills,
    strengths,
    goals,
    preferredIndustries,
    preferredRole: profile.preferredRole || user.preferredRole || '',
    careerInterests: user.careerInterests || [],
    recommendedCareers: profile.recommendedCareers || [],
    certifications: user.certifications || [],
    projects: user.projects || [],
    experience: user.experience || '',
    portfolioLinks: user.portfolioLinks || [],
    resumeInsights: profile.resumeInsights || null,
    previousRoadmaps: (profile.previousRoadmaps || []).slice(-5),
    lastChatSummary: profile.lastChatSummary || '',
  };
}

export function buildStudentContextPrompt(profile, user, extra = {}) {
  const merged = mergeProfileData(profile, user);
  return `Student profile:\n${JSON.stringify({ ...merged, ...extra }, null, 2)}`;
}

export function isProfileSufficientForRecommendations(profile = {}, user = {}) {
  const merged = mergeProfileData(profile, user);
  const hasEducation = Boolean(merged.education?.trim() || merged.degree?.trim());
  const hasInterestsOrStrengths =
    merged.interests.length + merged.strengths.length >= 2 || merged.skills.length >= 2;
  const hasGoalsOrIndustry =
    Boolean(merged.goals?.trim()) || merged.preferredIndustries.length > 0;

  return hasEducation && hasInterestsOrStrengths && hasGoalsOrIndustry;
}

export function formatList(items) {
  if (!items?.length) return 'Not provided yet';
  return items.join(', ');
}
