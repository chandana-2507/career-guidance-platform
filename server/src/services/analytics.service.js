import { createGeminiAgent } from './geminiWrapper.js';

const gemini = createGeminiAgent('analytics');
import { buildStudentContextPrompt } from './profileContext.js';

/**
 * Generate AI insights summary from real database metrics.
 * Scores are computed from DB; Gemini provides narrative summary only.
 */
export async function generateAnalyticsInsights({ profile, user, metrics }) {
  const prompt = `You are Analytics AI. Based on REAL computed metrics from the student's database, provide a brief career readiness narrative.

${buildStudentContextPrompt(profile, user)}

Computed metrics (from database — do not change these numbers):
${JSON.stringify(metrics, null, 2)}

Return valid JSON only:
{
  "strengthAreas": ["area where student excels"],
  "weakAreas": ["area needing improvement"],
  "recommendationsSummary": "2-3 sentence summary of what to focus on next",
  "missingSkillsHighlight": ["top 3-5 missing skills to prioritize"]
}

Rules:
- Base insights on the provided metrics only.
- Do not invent scores or data not in metrics.`;

  return gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'analytics insights',
    maxOutputTokens: 1500,
    dedupeKey: `analytics:${metrics.profileCompletion}:${metrics.careerMatchScore}`,
  });
}

export function computeAnalyticsMetrics({
  profile,
  user,
  cachedRecs,
  latestResume,
  roadmapProgressList,
  profileCompletion,
}) {
  const topRec = cachedRecs?.recommendations?.[0];
  const careerMatchScore = topRec?.matchScore ?? 0;
  const resumeScore = latestResume?.overallScore ?? latestResume?.score ?? 0;
  const skillCount = (user?.skills?.length || 0) + (profile?.skills?.length || 0);
  const skillScore = Math.min(100, skillCount * 8);
  const roadmapAvg = roadmapProgressList.length
    ? Math.round(
        roadmapProgressList.reduce((sum, r) => sum + (r.progressPercent || 0), 0) /
          roadmapProgressList.length,
      )
    : 0;
  const learningProgress = Math.max(profileCompletion, roadmapAvg);
  const careerReadiness = Math.round(
    (profileCompletion * 0.3 + careerMatchScore * 0.3 + resumeScore * 0.2 + learningProgress * 0.2),
  );

  const missingSkills = topRec?.missingSkills?.slice(0, 10) || [];

  return {
    profileCompletion,
    careerReadiness,
    skillScore,
    resumeScore,
    careerMatchScore,
    learningProgress,
    roadmapProgress: roadmapAvg,
    missingSkills,
    topRecommendation: topRec?.title || null,
  };
}
