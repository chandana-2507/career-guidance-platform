import { GoogleGenAI } from '@google/genai';
import { GEMINI_REQUEST_TIMEOUT_MS, getGeminiModelChain } from '../config/geminiConfig.js';
import { getAgentConfig, resolveAgentApiKey } from '../config/aiAgents.js';
import {
  createAiError,
  isRetryableGeminiError,
  logAiError,
} from '../utils/aiErrors.js';

const MAX_HISTORY_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_RETRIES = 3;

/** @type {Map<string, GoogleGenAI>} */
const clientCache = new Map();

/** @type {Map<string, Promise<unknown>>} */
const inflightRequests = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt) {
  return Math.min(800 * 2 ** attempt, 8000);
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

function getClientForAgent(agentId) {
  const { key, source } = resolveAgentApiKey(agentId);
  const cacheKey = `${agentId}:${key.slice(-8)}`;
  if (!clientCache.has(cacheKey)) {
    clientCache.set(cacheKey, new GoogleGenAI({ apiKey: key }));
    console.info(`[AI:${agentId}] Gemini client initialized (${source})`);
  }
  return clientCache.get(cacheKey);
}

function logMetric(agentId, payload) {
  console.info(
    `[AI:${agentId}]`,
    JSON.stringify({
      ts: new Date().toISOString(),
      agent: agentId,
      ...payload,
    }),
  );
}

function trimMessageHistory(messages) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-MAX_HISTORY_MESSAGES);
}

function toGeminiHistory(messages) {
  const trimmed = trimMessageHistory(messages);
  const history = [];

  for (const message of trimmed) {
    const role = message.role === 'assistant' ? 'model' : 'user';
    if (history.length > 0 && history[history.length - 1].role === role) {
      history[history.length - 1].parts[0].text += `\n\n${message.content}`;
      continue;
    }
    history.push({ role, parts: [{ text: message.content }] });
  }

  if (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  return history;
}

async function runDeduped(dedupeKey, fn) {
  if (inflightRequests.has(dedupeKey)) {
    logMetric(dedupeKey.split(':')[0], { event: 'dedupe_hit', dedupeKey });
    return inflightRequests.get(dedupeKey);
  }

  const promise = fn().finally(() => inflightRequests.delete(dedupeKey));
  inflightRequests.set(dedupeKey, promise);
  return promise;
}

function wrapAgentError(agentId, error) {
  const agent = getAgentConfig(agentId);
  const raw = String(error?.message || '').toLowerCase();
  const isConfigError =
    raw.includes('not configured') ||
    raw.includes('api key') ||
    error?.status === 401 ||
    error?.status === 403;

  return createAiError(error, {
    userMessage: isConfigError ? agent.configMessage : agent.busyMessage,
    statusCode: 503,
  });
}

async function generateWithModel(agentId, { model, message, history, systemInstruction }) {
  const ai = getClientForAgent(agentId);
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

/**
 * Create an isolated Gemini agent bound to a dedicated API key.
 * @param {keyof import('../config/aiAgents.js').AI_AGENTS} agentId
 */
export function createGeminiAgent(agentId) {
  const agent = getAgentConfig(agentId);

  return {
    id: agentId,
    label: agent.label,

    async generateWithModelFallback({
      message,
      history = [],
      systemInstruction,
      contextLabel = agentId,
      dedupeKey,
    }) {
      const key = dedupeKey || `${agentId}:chat:${message?.slice(0, 64)}`;
      const started = Date.now();

      return runDeduped(key, async () => {
        logMetric(agentId, { event: 'request_start', type: 'chat', contextLabel });

        const models = getGeminiModelChain();
        let lastError = null;

        for (let index = 0; index < models.length; index += 1) {
          const model = models[index];
          for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
            try {
              const text = await generateWithModel(agentId, {
                model,
                message,
                history,
                systemInstruction,
              });

              logMetric(agentId, {
                event: 'request_success',
                type: 'chat',
                contextLabel,
                model,
                durationMs: Date.now() - started,
                cacheHit: false,
              });

              return { text, model };
            } catch (error) {
              lastError = error;
              logAiError(`${agent.label} ${contextLabel} failed`, error, { agentId, model, attempt });
              if (attempt < MAX_RETRIES - 1 && isRetryableGeminiError(error)) {
                await sleep(backoffMs(attempt));
                continue;
              }
              break;
            }
          }
          if (index < models.length - 1) await sleep(400);
        }

        logMetric(agentId, {
          event: 'request_error',
          type: 'chat',
          contextLabel,
          durationMs: Date.now() - started,
          error: lastError?.message,
        });
        throw wrapAgentError(agentId, lastError || new Error('All Gemini models failed'));
      });
    },

    async generateJsonWithFallback({
      prompt,
      contextLabel = agentId,
      maxOutputTokens = 500,
      dedupeKey,
    }) {
      const key = dedupeKey || `${agentId}:json:${contextLabel}:${prompt?.length}`;
      const started = Date.now();

      return runDeduped(key, async () => {
        logMetric(agentId, { event: 'request_start', type: 'json', contextLabel });

        const ai = getClientForAgent(agentId);
        const models = getGeminiModelChain();
        let lastError = null;

        for (let index = 0; index < models.length; index += 1) {
          const model = models[index];
          for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
            try {
              const response = await withTimeout(
                ai.models.generateContent({
                  model,
                  contents: prompt,
                  config: {
                    temperature: 0.2,
                    maxOutputTokens,
                    responseMimeType: 'application/json',
                  },
                }),
              );

              const text = response?.text?.trim();
              if (!text) throw new Error(`Empty JSON response from ${model}`);

              const parsed = JSON.parse(text);
              logMetric(agentId, {
                event: 'request_success',
                type: 'json',
                contextLabel,
                model,
                durationMs: Date.now() - started,
                cacheHit: false,
              });
              return parsed;
            } catch (error) {
              lastError = error;
              logAiError(`${agent.label} ${contextLabel} failed`, error, { agentId, model, attempt });
              if (attempt < MAX_RETRIES - 1 && isRetryableGeminiError(error)) {
                await sleep(backoffMs(attempt));
                continue;
              }
              break;
            }
          }
          if (index < models.length - 1) await sleep(400);
        }

        logMetric(agentId, {
          event: 'request_error',
          type: 'json',
          contextLabel,
          durationMs: Date.now() - started,
          error: lastError?.message,
        });
        throw wrapAgentError(agentId, lastError || new Error('JSON generation failed'));
      });
    },

    async ping() {
      return this.generateWithModelFallback({
        message: 'Reply with exactly: OK',
        history: [],
        systemInstruction: 'Reply briefly.',
        contextLabel: 'startup probe',
        dedupeKey: `${agentId}:ping`,
      });
    },

    isConfigured() {
      try {
        resolveAgentApiKey(agentId);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function getMaxMessageLength() {
  return MAX_MESSAGE_LENGTH;
}

export function trimHistory(messages) {
  return trimMessageHistory(messages);
}

/** Startup probe for chat agent (backward compatible) */
export async function pingGemini() {
  return createGeminiAgent('chat').ping();
}

/** Probe each configured agent independently (chat agent only at startup to avoid quota spam) */
export async function probeAllAgents() {
  const { AI_AGENTS } = await import('../config/aiAgents.js');
  const results = {};
  const agentsToProbe = ['chat'];

  for (const agentId of agentsToProbe) {
    if (!AI_AGENTS[agentId]) continue;
    const agent = createGeminiAgent(agentId);
    if (!agent.isConfigured()) {
      results[agentId] = { ok: false, skipped: true, reason: 'API key not configured' };
      continue;
    }
    try {
      const { model } = await agent.ping();
      results[agentId] = { ok: true, model };
    } catch (error) {
      results[agentId] = {
        ok: false,
        error: error.userMessage || error.message,
      };
    }
  }

  for (const agentId of Object.keys(AI_AGENTS)) {
    if (results[agentId]) continue;
    const agent = createGeminiAgent(agentId);
    results[agentId] = agent.isConfigured()
      ? { ok: true, skipped: true, reason: 'Startup probe skipped (non-blocking)' }
      : { ok: false, skipped: true, reason: 'API key not configured' };
  }

  return results;
}
