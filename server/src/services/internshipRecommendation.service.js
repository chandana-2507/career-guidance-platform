import { createGeminiAgent } from './geminiWrapper.js';
import { buildStudentContextPrompt, mergeProfileData } from './profileContext.js';

const gemini = createGeminiAgent('internship');

export async function generateInternshipRecommendations({ career, profile, user }) {
  const merged = mergeProfileData(profile, user);
  const target = career || merged.preferredRole || 'their career goal';

  const prompt = `You are Internship Recommendation AI. Generate personalized internship guidance for this student targeting "${target}".

${buildStudentContextPrompt(profile, user, { targetCareer: target })}

Return valid JSON only:
{
  "internships": [{
    "company": "Company or organization type",
    "role": "Internship role title",
    "requiredSkills": ["skill"],
    "location": "City or Remote",
    "duration": "3-6 months",
    "stipend": "Expected stipend range",
    "applicationLink": "https://platform or company careers page",
    "difficulty": "Easy|Medium|Hard",
    "matchReason": "Why this suits the student",
    "preparationRoadmap": ["prep step"],
    "skillsNeeded": ["skill"],
    "platforms": ["LinkedIn, Internshala, etc."],
    "timeline": "When to apply",
    "applicationTips": ["tip"]
  }],
  "preparationRoadmap": ["overall prep step"],
  "skillsNeeded": ["key skills"],
  "platforms": ["job platforms"],
  "timeline": "Overall timeline",
  "applicationTips": ["general tips"]
}

Generate 4-6 internship recommendations based on profile, skills, career goal, and education.
Use realistic companies and roles appropriate for the student's level.`;

  return gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'internship recommendation',
    maxOutputTokens: 4096,
    dedupeKey: `internship:${target}:${merged.skills?.slice(0, 5).join(',')}`,
  });
}
