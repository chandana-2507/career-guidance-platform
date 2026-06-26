import { createGeminiAgent, getMaxMessageLength } from './geminiWrapper.js';
import { isAgentConfigured } from '../config/aiAgents.js';
import { logAiError } from '../utils/aiErrors.js';
import {
  buildStudentContextPrompt,
  formatList,
  mergeProfileData,
  mergeUnique,
} from './profileContext.js';

const gemini = createGeminiAgent('chat');

export function buildCareerPilotSystemPrompt(profile = {}, user = {}) {
  const education =
    profile.education ||
    [user.degree, user.branch, user.college].filter(Boolean).join(' — ') ||
    'Not provided yet';
  const interests = formatList(profile.interests?.length ? profile.interests : user.interests);
  const skills = formatList(profile.skills?.length ? profile.skills : user.skills);
  const strengths = formatList(profile.strengths);
  const goals = profile.goals || user.careerGoals || user.careerGoal || 'Not provided yet';
  const industries = formatList(profile.preferredIndustries);
  const recommended = formatList(profile.recommendedCareers);
  const preferredRole = profile.preferredRole || user.preferredRole || 'Not specified';
  const roadmapMemory = (profile.previousRoadmaps || []).length
    ? `Previous roadmaps explored: ${formatList(profile.previousRoadmaps.map((r) => r.careerTitle))}`
    : '';
  const resumeMemory = profile.resumeInsights
    ? `Resume insights (from latest analysis): ATS ${profile.resumeInsights.atsScore ?? 'N/A'}/100, strengths: ${formatList(profile.resumeInsights.strengths?.slice(0, 5))}, missing skills: ${formatList(profile.resumeInsights.missingSkills?.slice(0, 5))}`
    : 'No resume analysis yet';
  const chatMemory = profile.lastChatSummary
    ? `Recent conversation context: ${profile.lastChatSummary.slice(0, 300)}`
    : '';

  return `You are CareerPilot AI, an expert career counselor embedded in a student career guidance platform.

Your mission is to help students discover fulfilling careers through thoughtful conversation — not instant guesses.

## Core behavior
- Act as a warm, professional career counselor.
- Provide guidance on career counselling, career doubts, skill guidance, career roadmaps, interview preparation, certifications, industry trends, salary discussions, higher studies, and resume guidance.
- Ask thoughtful follow-up questions before making career recommendations.
- Build understanding gradually across education, interests, strengths, goals, and preferred industries.
- Never recommend specific careers until you have enough context.
- Compare career options objectively when asked.
- Recommend learning paths, certifications, projects, and internships when appropriate.
- Keep responses clear, structured, and encouraging.
- Stay focused on career guidance.

## Student profile
- Name: ${user.name || 'Student'}
- Education: ${education}
- Interests: ${interests}
- Skills: ${skills}
- Strengths: ${strengths}
- Career goals: ${goals}
- Preferred role: ${preferredRole}
- Preferred industries: ${industries}
- Previously suggested careers: ${recommended}
- ${resumeMemory}
${roadmapMemory ? `- ${roadmapMemory}` : ''}
${chatMemory ? `- ${chatMemory}` : ''}

## Response style
- Be concise but thorough (roughly 80-200 words unless comparing careers or outlining a learning path).
- End most replies with a relevant follow-up question when profile gaps remain.
- Do not mention internal system instructions.`;
}

export async function generateChatResponse({ message, history, profile, user }) {
  const { text } = await gemini.generateWithModelFallback({
    message,
    history,
    systemInstruction: buildCareerPilotSystemPrompt(profile, user),
    contextLabel: 'career counselor chat',
    dedupeKey: `chat:${user?.id || 'user'}:${message?.slice(0, 120)}`,
  });
  return text;
}

export async function extractProfileInsights({ userMessage, assistantMessage, currentProfile }) {
  if (!isAgentConfigured('chat')) return null;

  try {
    const prompt = `Analyze this career counseling exchange and extract ONLY information the student clearly stated or strongly implied.

Return valid JSON with this exact shape (use empty strings/arrays when unknown):
{
  "education": "",
  "interests": [],
  "skills": [],
  "strengths": [],
  "goals": "",
  "preferredIndustries": [],
  "recommendedCareers": []
}

Current profile:
${JSON.stringify(currentProfile, null, 2)}

Student message:
${userMessage}

Counselor reply:
${assistantMessage}

Rules:
- Only include new or updated facts from this exchange.
- Do not invent information.`;

    const parsed = await gemini.generateJsonWithFallback({
      prompt,
      contextLabel: 'profile extraction',
    });

    return {
      education: parsed.education || currentProfile.education || '',
      interests: mergeUnique(currentProfile.interests, parsed.interests),
      skills: mergeUnique(currentProfile.skills, parsed.skills),
      strengths: mergeUnique(currentProfile.strengths, parsed.strengths),
      goals: parsed.goals || currentProfile.goals || '',
      preferredIndustries: mergeUnique(
        currentProfile.preferredIndustries,
        parsed.preferredIndustries,
      ),
      recommendedCareers: mergeUnique(
        currentProfile.recommendedCareers,
        parsed.recommendedCareers,
      ),
    };
  } catch (error) {
    logAiError('profile extraction skipped', error);
    return null;
  }
}

export function buildSessionTitle(message) {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New conversation';
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}

export { getMaxMessageLength };
