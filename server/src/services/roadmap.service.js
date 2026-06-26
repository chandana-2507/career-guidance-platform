import { createGeminiAgent } from './geminiWrapper.js';
import { buildStudentContextPrompt } from './profileContext.js';

const gemini = createGeminiAgent('roadmap');

export async function generateDetailedRoadmap({ career, profile, user }) {
  const prompt = `You are Roadmap AI. Create a comprehensive learning roadmap for career "${career}".

${buildStudentContextPrompt(profile, user, { targetCareer: career })}

Return valid JSON only:
{
  "career": "${career}",
  "estimatedTotalDuration": "e.g. 12-18 months",
  "expectedSalaryAfterCompletion": "salary range after completing roadmap",
  "difficulty": "Beginner to Advanced path",
  "semesterPlan": [{ "semester": "Sem 1", "focus": "topics", "milestones": ["milestone"] }],
  "monthPlan": [{ "month": "Month 1", "focus": "topics", "milestones": ["milestone"] }],
  "weekMilestones": [{ "week": "Week 1-2", "tasks": ["task"] }],
  "learningOrder": ["topic order"],
  "programmingLanguages": ["language"],
  "frameworks": ["framework"],
  "projects": ["project to build"],
  "githubPortfolio": ["portfolio tip"],
  "internships": ["internship step"],
  "interviewPreparation": ["prep topic"],
  "resumePreparation": ["resume tip"],
  "jobPreparation": ["job prep step"],
  "freeResources": ["resource name or URL"],
  "certifications": ["cert"],
  "levels": {
    "beginner": {
      "title": "Beginner",
      "duration": "2-3 months",
      "skills": ["skill"],
      "courses": ["course"],
      "projects": ["project"],
      "books": ["book"],
      "certifications": ["cert"],
      "practicePlatforms": ["platform"],
      "interviewPrep": ["topic"]
    },
    "intermediate": { "title": "Intermediate", "duration": "", "skills": [], "courses": [], "projects": [], "books": [], "certifications": [], "practicePlatforms": [], "interviewPrep": [] },
    "advanced": { "title": "Advanced", "duration": "", "skills": [], "courses": [], "projects": [], "books": [], "certifications": [], "practicePlatforms": [], "interviewPrep": [] }
  }
}

Personalize based on student's current skills and education.`;

  return gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'roadmap',
    maxOutputTokens: 4096,
    dedupeKey: `roadmap:${career}`,
  });
}

export async function generateSkillGapAnalysis({ career, profile, user }) {
  const prompt = `You are Skill Gap AI. Analyze skill gap for career "${career}".

${buildStudentContextPrompt(profile, user)}

Return valid JSON only:
{
  "career": "${career}",
  "progressPercent": 45,
  "matchedSkills": ["skill they have"],
  "missingSkills": ["skill they lack"],
  "prioritySkills": [{ "skill": "name", "priority": "High|Medium|Low", "difficulty": "Easy|Medium|Hard", "estimatedWeeks": 4 }],
  "aiSuggestions": ["actionable suggestion"],
  "recommendedResources": [{ "title": "resource", "url": "https://...", "type": "course|book|platform" }]
}`;

  return gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'skill gap',
    maxOutputTokens: 3000,
    dedupeKey: `skillgap:${career}`,
  });
}
