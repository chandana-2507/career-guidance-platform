import { createGeminiAgent } from './geminiWrapper.js';
import { buildStudentContextPrompt } from './profileContext.js';

const gemini = createGeminiAgent('project');

export async function generateProjectIdeas({ career, profile, user, difficulty = 'intermediate' }) {
  const prompt = `You are Project Recommendation AI. Generate portfolio projects for career "${career}" at ${difficulty} skill level.

${buildStudentContextPrompt(profile, user, { targetCareer: career, difficulty })}

Return valid JSON only:
{
  "projects": [{
    "name": "Project Name",
    "description": "What to build",
    "skillsLearned": ["skill"],
    "technologies": ["tech stack"],
    "techStack": ["same as technologies"],
    "difficulty": "beginner|intermediate|advanced",
    "estimatedDuration": "2-4 weeks",
    "estimatedTime": "2-4 weeks",
    "githubStructure": "folder structure",
    "portfolioValue": "Why this helps portfolio",
    "learningOutcome": "What they learn",
    "category": "beginner|intermediate|advanced|industry|portfolio|github"
  }],
  "beginnerProjects": [],
  "intermediateProjects": [],
  "advancedProjects": [],
  "industryProjects": [],
  "portfolioProjects": [],
  "githubProjects": []
}

Generate 4-6 projects categorized by difficulty and type. Match student's education and current skills.`;

  const result = await gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'project recommendation',
    maxOutputTokens: 4096,
    dedupeKey: `project:${career}:${difficulty}`,
  });

  const projects = (result.projects || []).map((p) => ({
    name: String(p.name || '').trim(),
    description: String(p.description || '').trim(),
    skillsLearned: Array.isArray(p.skillsLearned) ? p.skillsLearned.map(String) : [],
    technologies: Array.isArray(p.technologies || p.techStack)
      ? (p.technologies || p.techStack).map(String)
      : [],
    difficulty: String(p.difficulty || difficulty).trim(),
    estimatedDuration: String(p.estimatedDuration || p.estimatedTime || '').trim(),
    githubStructure: String(p.githubStructure || '').trim(),
    portfolioValue: String(p.portfolioValue || '').trim(),
    learningOutcome: String(p.learningOutcome || '').trim(),
    category: String(p.category || p.difficulty || '').trim(),
  }));

  return { ...result, projects };
}
