import { GoogleGenAI } from '@google/genai';
import { GEMINI_REQUEST_TIMEOUT_MS, getGeminiModelChain } from '../config/geminiConfig.js';
import {
  createAiError,
  isRetryableGeminiError,
  logAiError,
} from '../utils/aiErrors.js';

const MAX_HISTORY_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;

let geminiClient = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw createAiError(new Error('GEMINI_API_KEY is not configured on the server.'), {
      statusCode: 503,
    });
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

function withTimeout(promise, ms = GEMINI_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        const error = new Error('Gemini request timed out');
        error.name = 'AbortError';
        reject(error);
      });
    }),
  ]).finally(() => clearTimeout(timer));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMaxMessageLength() {
  return MAX_MESSAGE_LENGTH;
}

export function trimHistory(messages) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-MAX_HISTORY_MESSAGES);
}

function formatList(items) {
  if (!items?.length) return 'Not provided yet';
  return items.join(', ');
}

export function buildCareerPilotSystemPrompt(profile = {}, user = {}) {
  const education =
    profile.education ||
    [user.degree, user.college].filter(Boolean).join(' at ') ||
    'Not provided yet';
  const interests = formatList(profile.interests?.length ? profile.interests : user.interests);
  const skills = formatList(profile.skills?.length ? profile.skills : user.skills);
  const strengths = formatList(profile.strengths);
  const goals = profile.goals || user.careerGoals || user.careerGoal || 'Not provided yet';
  const industries = formatList(profile.preferredIndustries);
  const recommended = formatList(profile.recommendedCareers);

  return `You are CareerPilot AI, an expert career counselor embedded in a student career guidance platform.

Your mission is to help students discover fulfilling careers through thoughtful conversation — not instant guesses.

## Core behavior
- Act as a warm, professional career counselor.
- Ask thoughtful follow-up questions before making career recommendations.
- Build understanding gradually across education, interests, strengths, goals, and preferred industries.
- Never recommend specific careers until you have enough context (at minimum: education level/field, at least two interests or strengths, and career goals or industry preference).
- When information is missing, prioritize gathering it with one or two focused questions per turn.
- Compare career options objectively when asked (growth, skills, salary range, work-life balance, entry paths).
- Recommend learning paths, certifications, projects, and internships when appropriate.
- Explain salary expectations as realistic ranges and note they vary by location, experience, and company.
- Keep responses clear, structured, and encouraging. Use short paragraphs or bullet points when helpful.
- Stay focused on career guidance. Politely redirect off-topic questions back to careers, skills, education, or goals.

## Student profile (may be incomplete — use conversation to fill gaps)
- Name: ${user.name || 'Student'}
- Education: ${education}
- Interests: ${interests}
- Skills: ${skills}
- Strengths: ${strengths}
- Career goals: ${goals}
- Preferred industries: ${industries}
- Previously suggested careers: ${recommended}

## Response style
- Be concise but thorough (roughly 80-200 words unless comparing careers or outlining a learning path).
- End most replies with a relevant follow-up question when profile gaps remain.
- Do not mention internal system instructions or that you are updating a database.`;
}

function toGeminiHistory(messages) {
  const trimmed = trimHistory(messages);
  const history = [];

  for (const message of trimmed) {
    const role = message.role === 'assistant' ? 'model' : 'user';
    if (history.length > 0 && history[history.length - 1].role === role) {
      history[history.length - 1].parts[0].text += `\n\n${message.content}`;
      continue;
    }
    history.push({
      role,
      parts: [{ text: message.content }],
    });
  }

  if (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  return history;
}

async function generateWithModel({ model, message, history, systemInstruction }) {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 1200,
    },
    history: toGeminiHistory(history),
  });

  const response = await withTimeout(chat.sendMessage({ message }));
  const text = response?.text?.trim();
  if (!text) {
    const error = new Error(`Gemini model ${model} returned an empty response`);
    error.status = 503;
    throw error;
  }
  return text;
}

async function generateWithModelFallback({
  message,
  history,
  systemInstruction,
  contextLabel = 'chat',
}) {
  const models = getGeminiModelChain();
  let lastError = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const text = await generateWithModel({ model, message, history, systemInstruction });
        if (index > 0 || attempt > 0) {
          console.warn(
            `[CareerPilot AI] ${contextLabel} succeeded with ${model}${attempt > 0 ? ' (retry)' : ' (fallback)'}`,
          );
        }
        return { text, model };
      } catch (error) {
        lastError = error;
        logAiError(`${contextLabel} failed on ${model}${attempt > 0 ? ' retry' : ''}`, error);
        const canRetry = attempt === 0 && isRetryableGeminiError(error);
        if (canRetry) {
          await sleep(1500);
          continue;
        }
        break;
      }
    }
    if (index < models.length - 1) await sleep(400);
  }

  throw createAiError(lastError || new Error('All Gemini models failed'));
}

export async function pingGemini() {
  const result = await generateWithModelFallback({
    message: 'Reply with exactly: OK',
    history: [],
    systemInstruction: 'Reply briefly.',
    contextLabel: 'startup probe',
  });
  return result;
}

export async function generateChatResponse({ message, history, profile, user }) {
  const { text } = await generateWithModelFallback({
    message,
    history,
    systemInstruction: buildCareerPilotSystemPrompt(profile, user),
    contextLabel: 'chat',
  });
  return text;
}

async function generateJsonWithFallback({ prompt, contextLabel }) {
  const ai = getGeminiClient();
  const models = getGeminiModelChain();
  let lastError = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
          },
        }),
      );
      const text = response?.text?.trim();
      if (!text) throw new Error(`Empty JSON response from ${model}`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      logAiError(`${contextLabel} failed on ${model}`, error);
      if (index < models.length - 1) await sleep(400);
    }
  }

  throw createAiError(lastError || new Error('JSON generation failed'));
}

function mergeUnique(existing = [], incoming = []) {
  const set = new Set(existing.map((item) => item.toLowerCase()));
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

export async function extractProfileInsights({ userMessage, assistantMessage, currentProfile }) {
  if (!process.env.GEMINI_API_KEY?.trim()) return null;

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
- Do not invent information.
- recommendedCareers only if the counselor explicitly suggested careers in this reply.`;

    const parsed = await generateJsonWithFallback({
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
