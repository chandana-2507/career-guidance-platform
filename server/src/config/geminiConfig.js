import { validateAllAgentKeys, AI_AGENTS } from './aiAgents.js';

export const GEMINI_REQUEST_TIMEOUT_MS = parseInt(
  process.env.GEMINI_REQUEST_TIMEOUT_MS || '45000',
  10,
);

const PRIMARY_MODEL = 'gemini-2.0-flash';
const DEFAULT_FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];

export function getGeminiModelChain() {
  const configured = process.env.GEMINI_MODEL?.trim();
  const fallbacks = process.env.GEMINI_FALLBACK_MODELS
    ? process.env.GEMINI_FALLBACK_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_FALLBACK_MODELS;

  const chain = [];
  if (configured) chain.push(configured);
  chain.push(PRIMARY_MODEL, ...fallbacks);

  return [...new Set(chain)];
}

export function validateGeminiConfig() {
  const agentValidation = validateAllAgentKeys();
  const models = getGeminiModelChain();

  console.log(`[CareerPilot AI] Model: ${process.env.GEMINI_MODEL?.trim() || PRIMARY_MODEL}`);
  console.log(`[CareerPilot AI] Model chain: ${models.join(' → ')}`);
  console.log(
    `[CareerPilot AI] Configured agents (${agentValidation.configured.length}/${Object.keys(AI_AGENTS).length}): ${agentValidation.configured.join(', ') || 'none'}`,
  );

  return {
    ok: agentValidation.ok,
    warnings: agentValidation.warnings,
    errors: agentValidation.errors,
    models,
    agents: agentValidation,
  };
}

export async function probeGeminiConnection() {
  const { ok, errors } = validateGeminiConfig();
  if (!ok) return { ok: false, errors };

  try {
    const { probeAllAgents } = await import('../services/geminiWrapper.js');
    const results = await probeAllAgents();
    const configured = Object.entries(results).filter(([, r]) => !r.skipped);
    const healthy = configured.filter(([, r]) => r.ok);
    const failed = configured.filter(([, r]) => !r.ok);

    if (healthy.length > 0) {
      console.log(
        `[CareerPilot AI] Agent probes: ${healthy.length} healthy, ${failed.length} failed, ${Object.values(results).filter((r) => r.skipped).length} skipped`,
      );
      const chatResult = results.chat;
      return { ok: true, agents: results, model: chatResult?.model };
    }

    return {
      ok: false,
      errors: failed.map(([id, r]) => `${id}: ${r.error}`),
      agents: results,
    };
  } catch (error) {
    return {
      ok: false,
      errors: [`Gemini connectivity probe failed: ${error.message}`],
    };
  }
}
