export const FRIENDLY_BUSY =
  'CareerPilot AI is temporarily busy. Please try again shortly.';

export const FRIENDLY_UNAVAILABLE =
  'CareerPilot AI is temporarily unavailable. Please try again in a few minutes.';

export const FRIENDLY_CONFIG =
  'CareerPilot AI is not configured yet. Please contact the administrator.';

export const FRIENDLY_GENERIC =
  'Something went wrong while processing your message. Please try again.';

export const FRIENDLY_TIMEOUT =
  'CareerPilot AI took too long to respond. Please try again with a shorter message.';

export const FRIENDLY_RATE_LIMIT =
  'You have sent many messages recently. Please wait a moment and try again.';

function parseGeminiPayload(message) {
  if (!message || typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.error || parsed;
  } catch {
    return null;
  }
}

function extractErrorCode(error) {
  const payload = parseGeminiPayload(error?.message);
  const code = payload?.code ?? error?.status ?? error?.statusCode;
  return code ? Number(code) : null;
}

function extractErrorMessage(error) {
  const payload = parseGeminiPayload(error?.message);
  if (payload?.message) return String(payload.message);
  if (typeof error?.message === 'string' && !error.message.trim().startsWith('{')) {
    return error.message;
  }
  return 'Unknown Gemini API error';
}

export function isRetryableGeminiError(error) {
  const code = extractErrorCode(error);
  const message = extractErrorMessage(error).toLowerCase();

  if ([408, 429, 500, 503, 504].includes(code)) return true;
  if (message.includes('high demand')) return true;
  if (message.includes('unavailable')) return true;
  if (message.includes('overloaded')) return true;
  if (message.includes('resource exhausted')) return true;
  if (message.includes('quota')) return true;
  if (message.includes('rate limit')) return true;
  if (message.includes('not found') && message.includes('model')) return true;
  if (error?.name === 'AbortError' || message.includes('timeout')) return true;

  return false;
}

export function toUserFacingAiMessage(error) {
  if (error?.isAiError && error.userMessage) return error.userMessage;

  const code = extractErrorCode(error);
  const raw = extractErrorMessage(error).toLowerCase();

  if (error?.name === 'AbortError' || raw.includes('timeout')) {
    return FRIENDLY_TIMEOUT;
  }
  if (code === 401 || code === 403 || raw.includes('api key')) {
    return FRIENDLY_CONFIG;
  }
  if (code === 429 || raw.includes('quota') || raw.includes('rate limit')) {
    return FRIENDLY_RATE_LIMIT;
  }
  if (code === 503 || raw.includes('high demand') || raw.includes('unavailable')) {
    return FRIENDLY_BUSY;
  }
  if (raw.includes('gemini_api_key') || raw.includes('not configured')) {
    return FRIENDLY_CONFIG;
  }

  return FRIENDLY_GENERIC;
}

export function createAiError(error, overrides = {}) {
  const logMessage = extractErrorMessage(error);
  const code = extractErrorCode(error);
  const aiError = new Error(overrides.userMessage || toUserFacingAiMessage(error));
  aiError.name = 'AiServiceError';
  aiError.isAiError = true;
  aiError.statusCode = overrides.statusCode || (code === 429 ? 503 : 503);
  aiError.userMessage = aiError.message;
  aiError.logMessage = logMessage;
  aiError.retryable = isRetryableGeminiError(error);
  aiError.cause = error;
  return aiError;
}

export function logAiError(context, error, extra = {}) {
  const payload = parseGeminiPayload(error?.message);
  console.error(`[CareerPilot AI] ${context}`, {
    ...extra,
    name: error?.name,
    code: extractErrorCode(error),
    message: payload?.message || error?.logMessage || error?.message,
  });
}
