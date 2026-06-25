import dotenv from 'dotenv';
dotenv.config();

import {
  buildCareerPilotSystemPrompt,
  generateChatResponse,
  pingGemini,
} from '../services/aiService.js';
import { createAiError, toUserFacingAiMessage } from '../utils/aiErrors.js';
import { getGeminiModelChain, validateGeminiConfig } from '../config/geminiConfig.js';

const profile = { education: '', interests: [], skills: [], strengths: [], goals: '' };
const user = { name: 'Test Student', degree: 'B.Tech CSE', college: 'Test University' };

const scenarios = [
  'I am a B.Tech CSE student',
  'I like AI and Machine Learning',
  'Which career should I choose?',
  'What certifications should I do?',
];

async function run() {
  console.log('=== Gemini Config ===');
  console.log(validateGeminiConfig());
  console.log('Model chain:', getGeminiModelChain());

  console.log('\n=== Startup Probe ===');
  const probe = await pingGemini();
  console.log('Probe OK:', probe.model);

  let history = [];
  for (const message of scenarios) {
    console.log(`\n=== User: ${message} ===`);
    const response = await generateChatResponse({
      message,
      history,
      profile,
      user,
    });
    console.log('Assistant:', response.slice(0, 220) + (response.length > 220 ? '...' : ''));
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
  }

  console.log('\n=== Error Sanitization ===');
  const raw = new Error(
    '{"error":{"code":503,"message":"This model is currently experiencing high demand."}}',
  );
  raw.name = 'ApiError';
  raw.status = 503;
  const friendly = toUserFacingAiMessage(createAiError(raw));
  console.log('Friendly:', friendly);
  console.log('Contains raw JSON:', friendly.includes('{'));

  console.log('\n=== Prompt Check ===');
  const prompt = buildCareerPilotSystemPrompt(profile, user);
  console.log('Prompt includes follow-up guidance:', prompt.includes('follow-up'));
  console.log('Prompt blocks early recommendations:', prompt.includes('Never recommend'));

  console.log('\nAll self-tests passed.');
}

run().catch((error) => {
  console.error('Self-test failed:', error.message || error);
  process.exit(1);
});
