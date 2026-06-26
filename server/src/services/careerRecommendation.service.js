import { createAiError } from '../utils/aiErrors.js';
import { createGeminiAgent } from './geminiWrapper.js';
import { buildStudentContextPrompt, mergeProfileData } from './profileContext.js';

const gemini = createGeminiAgent('recommend');

function normalizeRecommendation(rec) {
  return {
    title: String(rec.title || rec.careerName || '').trim(),
    matchScore: Math.min(100, Math.max(0, Number(rec.matchScore || rec.matchPercentage) || 0)),
    reason: String(rec.reason || '').trim(),
    requiredSkills: Array.isArray(rec.requiredSkills) ? rec.requiredSkills.map(String) : [],
    missingSkills: Array.isArray(rec.missingSkills) ? rec.missingSkills.map(String) : [],
    futureScope: String(rec.futureScope || rec.futureGrowth || rec.growthOutlook || '').trim(),
    salaryRange: String(rec.salaryRange || rec.salary || '').trim(),
    demand: String(rec.demand || '').trim(),
    difficulty: String(rec.difficulty || '').trim(),
    learningRoadmap: Array.isArray(rec.learningRoadmap || rec.roadmap)
      ? (rec.learningRoadmap || rec.roadmap).map(String)
      : [],
    recommendedProjects: Array.isArray(rec.recommendedProjects || rec.projectsToBuild)
      ? (rec.recommendedProjects || rec.projectsToBuild).map(String)
      : [],
    recommendedCertifications: Array.isArray(
      rec.recommendedCertifications || rec.certifications,
    )
      ? (rec.recommendedCertifications || rec.certifications).map(String)
      : [],
    recommendedInternships: Array.isArray(rec.recommendedInternships)
      ? rec.recommendedInternships.map(String)
      : [],
    freeLearningResources: Array.isArray(rec.freeLearningResources)
      ? rec.freeLearningResources.map(String)
      : [],
    timeToJobReady: String(rec.timeToJobReady || rec.expectedTimeToJobReady || '').trim(),
    // legacy aliases for existing UI
    roadmap: Array.isArray(rec.learningRoadmap || rec.roadmap)
      ? (rec.learningRoadmap || rec.roadmap).map(String)
      : [],
    certifications: Array.isArray(rec.recommendedCertifications || rec.certifications)
      ? (rec.recommendedCertifications || rec.certifications).map(String)
      : [],
    projectsToBuild: Array.isArray(rec.recommendedProjects || rec.projectsToBuild)
      ? (rec.recommendedProjects || rec.projectsToBuild).map(String)
      : [],
    growthOutlook: String(rec.futureScope || rec.futureGrowth || rec.growthOutlook || '').trim(),
    futureGrowth: String(rec.futureScope || rec.futureGrowth || '').trim(),
  };
}

export async function generateCareerRecommendations({ profile, user }) {
  const merged = mergeProfileData(profile, user);

  const prompt = `You are Career Recommendation AI — a specialized agent that ONLY uses student profile data (NOT chat history).

Analyze this student profile and generate top career recommendations.

${buildStudentContextPrompt(profile, user)}

Consider: degree, branch, education, skills, interests, career goals, preferred industries, resume insights, certifications, projects, and experience.

Return valid JSON only:
{
  "recommendations": [
    {
      "title": "Career Name",
      "matchScore": 85,
      "reason": "2-3 sentences why this fits THIS student",
      "requiredSkills": ["skill1"],
      "missingSkills": ["skill to learn"],
      "futureScope": "Future demand and scope",
      "salaryRange": "Entry to mid-level range with context",
      "demand": "Current market demand level",
      "difficulty": "Easy|Medium|Hard",
      "learningRoadmap": ["Step 1", "Step 2"],
      "recommendedProjects": ["Project idea"],
      "recommendedCertifications": ["Cert name"],
      "recommendedInternships": ["Internship type or role"],
      "freeLearningResources": ["Resource name or URL"],
      "timeToJobReady": "e.g. 6-12 months"
    }
  ]
}

Rules:
- Generate exactly 3 to 5 recommendations ranked by matchScore.
- Personalize every field to this student's profile.
- Do NOT use generic advice.`;

  const parsed = await gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'career recommendation',
    maxOutputTokens: 4096,
    dedupeKey: `recommend:${user?._id || user?.id || 'user'}:${merged.education}:${merged.skills?.join(',')}`,
  });

  const recommendations = (parsed.recommendations || [])
    .slice(0, 5)
    .map(normalizeRecommendation)
    .filter((rec) => rec.title);

  if (!recommendations.length) {
    throw createAiError(new Error('No recommendations generated'), { statusCode: 503 });
  }

  return recommendations;
}
