import { createGeminiAgent } from './geminiWrapper.js';
import { buildStudentContextPrompt } from './profileContext.js';

const gemini = createGeminiAgent('compare');

export async function compareCareersWithAi({ careerA, careerB, profile, user }) {
  const prompt = `You are Career Comparison AI — compare two careers for this student.

Careers: "${careerA}" vs "${careerB}"

${buildStudentContextPrompt(profile, user)}

Return valid JSON only:
{
  "careerA": "${careerA}",
  "careerB": "${careerB}",
  "comparison": {
    "overview": { "careerA": "text", "careerB": "text" },
    "responsibilities": { "careerA": "text", "careerB": "text" },
    "requiredSkills": { "careerA": [], "careerB": [] },
    "salary": { "careerA": "range", "careerB": "range", "winner": "A|B|Tie" },
    "growth": { "careerA": "text", "careerB": "text", "winner": "A|B|Tie" },
    "demand": { "careerA": "text", "careerB": "text", "winner": "A|B|Tie" },
    "aiImpact": { "careerA": "text", "careerB": "text" },
    "future": { "careerA": "text", "careerB": "text" },
    "remoteWork": { "careerA": "text", "careerB": "text" },
    "learningCurve": { "careerA": "text", "careerB": "text" },
    "workLifeBalance": { "careerA": "text", "careerB": "text" },
    "difficulty": { "careerA": "text", "careerB": "text" },
    "pros": { "careerA": [], "careerB": [] },
    "cons": { "careerA": [], "careerB": [] },
    "bestCertifications": { "careerA": [], "careerB": [] },
    "bestProjects": { "careerA": [], "careerB": [] },
    "whoShouldChoose": { "careerA": "text", "careerB": "text" },
    "learningTime": { "careerA": "months", "careerB": "months" },
    "remoteOpportunities": { "careerA": "text", "careerB": "text" },
    "futureScope": { "careerA": "text", "careerB": "text" }
  },
  "aiRecommendation": "Final recommendation for this student (2-4 sentences)"
}`;

  return gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'career comparison',
    maxOutputTokens: 4096,
    dedupeKey: `compare:${careerA}:${careerB}`,
  });
}
