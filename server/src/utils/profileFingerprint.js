import crypto from 'crypto';

export function buildProfileFingerprint(profile = {}, user = {}) {
  const payload = {
    education: profile.education || [user.degree, user.branch, user.college].filter(Boolean).join(' — '),
    degree: user.degree || '',
    branch: user.branch || '',
    skills: [...(user.skills || []), ...(profile.skills || [])].map((s) => s.toLowerCase()).sort(),
    interests: [...(user.interests || []), ...(profile.interests || [])].map((s) => s.toLowerCase()).sort(),
    strengths: (profile.strengths || []).map((s) => s.toLowerCase()).sort(),
    goals: profile.goals || user.careerGoals || user.careerGoal || '',
    preferredIndustries: (profile.preferredIndustries || []).slice().sort(),
    preferredIndustry: user.preferredIndustry || '',
    preferredRole: user.preferredRole || profile.preferredRole || '',
    careerInterests: (user.careerInterests || []).slice().sort(),
    certifications: (user.certifications || []).map((s) => s.toLowerCase()).sort(),
    projects: (user.projects || []).map((s) => String(s).toLowerCase()).sort(),
    experience: user.experience || '',
    resumeHash: profile.resumeInsights?.resumeHash || profile.resumeInsights?.analyzedAt || '',
  };

  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function buildResumeContentHash(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

export function calculateProfileCompletion(profile = {}, user = {}) {
  const checks = [
    Boolean(user.name?.trim()),
    Boolean(user.college?.trim() || user.degree?.trim() || profile.education?.trim()),
    (user.skills?.length || 0) + (profile.skills?.length || 0) >= 2,
    (user.interests?.length || 0) + (profile.interests?.length || 0) >= 1,
    Boolean(user.careerGoals?.trim() || user.careerGoal?.trim() || profile.goals?.trim()),
    Boolean(user.preferredIndustry?.trim() || profile.preferredIndustries?.length),
    (user.certifications?.length || 0) >= 1 || (user.projects?.length || 0) >= 1,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
