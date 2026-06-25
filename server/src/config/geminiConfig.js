const PRIMARY_MODEL = 'gemini-2.0-flash';
const DEFAULT_FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];

export const GEMINI_REQUEST_TIMEOUT_MS = parseInt(
  process.env.GEMINI_REQUEST_TIMEOUT_MS || '45000',
  10,
);

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
  const warnings = [];
  const errors = [];
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    errors.push('GEMINI_API_KEY is missing. CareerPilot AI chat will not work.');
    return { ok: false, warnings, errors };
  }

  if (apiKey.length < 20) {
    warnings.push('GEMINI_API_KEY looks unusually short. Verify it in Google AI Studio.');
  }

  if (!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')) {
    warnings.push(
      'GEMINI_API_KEY format is unexpected. Google AI Studio keys usually start with "AIza".',
    );
  }

  const models = getGeminiModelChain();
  console.log(`[CareerPilot AI] Model chain: ${models.join(' → ')}`);

  return { ok: true, warnings, errors, models };
}

export async function probeGeminiConnection() {
  const { ok, errors } = validateGeminiConfig();
  if (!ok) return { ok: false, errors };

  try {
    const { pingGemini } = await import('../services/aiService.js');
    const result = await pingGemini();
    return { ok: true, model: result.model };
  } catch (error) {
    return {
      ok: false,
      errors: [`Gemini connectivity probe failed: ${error.logMessage || error.message}`],
    };
  }
}
