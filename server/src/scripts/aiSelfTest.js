import dotenv from 'dotenv';
dotenv.config();

import { validateGeminiConfig } from '../config/geminiConfig.js';
import { AI_AGENTS } from '../config/aiAgents.js';
import { probeAllAgents, createGeminiAgent } from '../services/geminiWrapper.js';
import {
  buildCareerPilotSystemPrompt,
} from '../services/careerCounselor.service.js';
import { createAiError, toUserFacingAiMessage } from '../utils/aiErrors.js';
import { getGeminiModelChain } from '../config/geminiConfig.js';

const profile = { education: '', interests: [], skills: [], strengths: [], goals: '' };
const user = { name: 'Test Student', degree: 'B.Tech CSE', college: 'Test University' };

async function run() {
  console.log('=== Multi-Agent Gemini Config ===');
  const config = validateGeminiConfig();
  console.log(config);
  console.log('Model chain:', getGeminiModelChain());

  console.log('\n=== Agent Key Status ===');
  for (const [id, agent] of Object.entries(AI_AGENTS)) {
    const configured = Boolean(process.env[agent.envKey]?.trim());
    console.log(`${id.padEnd(12)} ${agent.envKey.padEnd(28)} ${configured ? 'OK' : 'MISSING'}`);
  }

  console.log('\n=== Per-Agent Probes ===');
  const probes = await probeAllAgents();
  for (const [id, result] of Object.entries(probes)) {
    console.log(`${id}:`, result);
  }

  const chatAgent = createGeminiAgent('chat');
  if (chatAgent.isConfigured()) {
    console.log('\n=== Chat Agent Smoke Test ===');
    const { generateChatResponse } = await import('../services/careerCounselor.service.js');
    const response = await generateChatResponse({
      message: 'I am a B.Tech CSE student interested in AI',
      history: [],
      profile,
      user,
    });
    console.log('Assistant:', response.slice(0, 200));
  }

  console.log('\n=== Error Sanitization ===');
  const raw = new Error('{"error":{"code":429,"message":"Quota exceeded"}}');
  raw.name = 'ApiError';
  raw.status = 429;
  const friendly = toUserFacingAiMessage(createAiError(raw));
  console.log('Friendly:', friendly);
  console.log('Contains raw JSON:', friendly.includes('{'));

  console.log('\n=== Prompt Check ===');
  const prompt = buildCareerPilotSystemPrompt(profile, user);
  console.log('Prompt includes follow-up guidance:', prompt.includes('follow-up'));

  console.log('\nSelf-test complete.');
}

run().catch((error) => {
  console.error('Self-test failed:', error.message || error);
  process.exit(1);
});
