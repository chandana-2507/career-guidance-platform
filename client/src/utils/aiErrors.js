const FRIENDLY_FALLBACK =
  'CareerPilot AI is temporarily busy. Please try again shortly.';

function parseJsonMessage(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.error?.message || parsed?.message || null;
  } catch {
    return null;
  }
}

export function getFriendlyClientError(err, fallback = FRIENDLY_FALLBACK) {
  const apiMessage = err?.response?.data?.message;
  if (apiMessage && typeof apiMessage === 'string' && !apiMessage.trim().startsWith('{')) {
    return apiMessage;
  }

  const rawMessage = err?.message;
  if (rawMessage && !rawMessage.trim().startsWith('{')) {
    return rawMessage;
  }

  const parsed = parseJsonMessage(apiMessage) || parseJsonMessage(rawMessage);
  if (parsed) {
    const lower = parsed.toLowerCase();
    if (lower.includes('quota') || lower.includes('rate limit')) {
      return 'You have sent many messages recently. Please wait a moment and try again.';
    }
    if (lower.includes('high demand') || lower.includes('unavailable')) {
      return FRIENDLY_FALLBACK;
    }
    return fallback;
  }

  if (err?.response?.status === 429) {
    return 'You have sent many messages recently. Please wait a moment and try again.';
  }

  if (err?.response?.status >= 500) {
    return FRIENDLY_FALLBACK;
  }

  return fallback;
}
