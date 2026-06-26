/**
 * Multi-agent AI registry — each agent uses its own Gemini API key.
 * Legacy GEMINI_API_KEY is NOT used when a dedicated key is configured.
 */
export const AI_AGENTS = {
  chat: {
    id: 'chat',
    label: 'CareerPilot AI',
    envKey: 'GEMINI_CHAT_API_KEY',
    busyMessage:
      'CareerPilot AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'CareerPilot AI is not configured. Please set GEMINI_CHAT_API_KEY.',
  },
  recommend: {
    id: 'recommend',
    label: 'Career Recommendation AI',
    envKey: 'GEMINI_RECOMMEND_API_KEY',
    busyMessage:
      'The Career Recommendation AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Career recommendations are not configured. Please set GEMINI_RECOMMEND_API_KEY.',
  },
  compare: {
    id: 'compare',
    label: 'Career Comparison AI',
    envKey: 'GEMINI_COMPARE_API_KEY',
    busyMessage:
      'The Career Comparison AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Career comparison is not configured. Please set GEMINI_COMPARE_API_KEY.',
  },
  resume: {
    id: 'resume',
    label: 'Resume Analyzer AI',
    envKey: 'GEMINI_RESUME_API_KEY',
    busyMessage:
      'The Resume Analyzer AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Resume analysis is not configured. Please set GEMINI_RESUME_API_KEY.',
  },
  internship: {
    id: 'internship',
    label: 'Internship Recommendation AI',
    envKey: 'GEMINI_INTERNSHIP_API_KEY',
    busyMessage:
      'The Internship Recommendation AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Internship recommendations are not configured. Please set GEMINI_INTERNSHIP_API_KEY.',
  },
  project: {
    id: 'project',
    label: 'Project Recommendation AI',
    envKey: 'GEMINI_PROJECT_API_KEY',
    busyMessage:
      'The Project Recommendation AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Project recommendations are not configured. Please set GEMINI_PROJECT_API_KEY.',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics AI',
    envKey: 'GEMINI_ANALYTICS_API_KEY',
    busyMessage:
      'The Analytics AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Analytics insights are not configured. Please set GEMINI_ANALYTICS_API_KEY.',
  },
  roadmap: {
    id: 'roadmap',
    label: 'Roadmap AI',
    envKey: 'GEMINI_ROADMAP_API_KEY',
    busyMessage:
      'The Roadmap AI is temporarily busy. Please try again in a minute.',
    configMessage:
      'Learning roadmaps are not configured. Please set GEMINI_ROADMAP_API_KEY.',
  },
};

export function getAgentConfig(agentId) {
  const agent = AI_AGENTS[agentId];
  if (!agent) throw new Error(`Unknown AI agent: ${agentId}`);
  return agent;
}

const SHARED_KEY_ENV = 'GEMINI_SHARED_API_KEY';
const CORE_KEY_PRIORITY = [
  'GEMINI_CHAT_API_KEY',
  'GEMINI_RECOMMEND_API_KEY',
  'GEMINI_COMPARE_API_KEY',
  'GEMINI_RESUME_API_KEY',
];

function getFirstConfiguredKey(envKeys) {
  for (const envKey of envKeys) {
    const key = process.env[envKey]?.trim();
    if (key) return { key, source: envKey };
  }
  return null;
}

/** True when dedicated key, shared key, or a core fallback key is available. */
export function isAgentConfigured(agentId) {
  try {
    resolveAgentApiKey(agentId);
    return true;
  } catch {
    return false;
  }
}

export function resolveAgentApiKey(agentId) {
  const agent = getAgentConfig(agentId);
  const dedicated = process.env[agent.envKey]?.trim();
  if (dedicated) return { key: dedicated, source: agent.envKey, agent, fallback: false };

  const shared = process.env[SHARED_KEY_ENV]?.trim();
  if (shared) {
    return { key: shared, source: SHARED_KEY_ENV, agent, fallback: true };
  }

  const core = getFirstConfiguredKey(CORE_KEY_PRIORITY);
  if (core) {
    return { key: core.key, source: core.source, agent, fallback: true };
  }

  throw new Error(agent.configMessage);
}

export function validateAllAgentKeys() {
  const warnings = [];
  const errors = [];
  const configured = [];
  const missing = [];

  for (const agent of Object.values(AI_AGENTS)) {
    const dedicated = process.env[agent.envKey]?.trim();
    if (dedicated) {
      configured.push(agent.id);
      if (dedicated.length < 20) {
        warnings.push(`${agent.envKey} looks unusually short.`);
      }
      continue;
    }

    missing.push({ id: agent.id, envKey: agent.envKey, label: agent.label });
    if (isAgentConfigured(agent.id)) {
      configured.push(`${agent.id}(fallback)`);
    }
  }

  if (!configured.length) {
    errors.push(
      'No Gemini API keys found. Set GEMINI_CHAT_API_KEY (and optional GEMINI_*_API_KEY per agent) in server/.env.',
    );
    return { ok: false, warnings, errors, configured, missing };
  }

  const missingDedicated = missing.filter((m) => !isAgentConfigured(m.id));
  if (missingDedicated.length) {
    warnings.push(
      `Missing keys for: ${missingDedicated.map((m) => m.envKey).join(', ')}. Those modules are unavailable.`,
    );
  } else if (missing.length) {
    warnings.push(
      `Some agents use fallback keys (set dedicated GEMINI_*_API_KEY values to isolate quota): ${missing.map((m) => m.envKey).join(', ')}.`,
    );
  }

  return { ok: configured.length > 0, warnings, errors, configured, missing };
}
