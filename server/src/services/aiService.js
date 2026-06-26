/**
 * Backward-compatible re-exports from modular AI services.
 * Each service uses its own dedicated Gemini API key via geminiWrapper.
 */
export { pingGemini, probeAllAgents, createGeminiAgent } from './geminiWrapper.js';
export {
  buildCareerPilotSystemPrompt,
  generateChatResponse,
  extractProfileInsights,
  buildSessionTitle,
  getMaxMessageLength,
} from './careerCounselor.service.js';
export { generateCareerRecommendations } from './careerRecommendation.service.js';
export { compareCareersWithAi } from './careerComparison.service.js';
export { analyzeResumeWithAi } from './resumeAnalyzer.service.js';
export { generateInternshipRecommendations } from './internshipRecommendation.service.js';
export { generateProjectIdeas } from './projectRecommendation.service.js';
export {
  generateDetailedRoadmap,
  generateSkillGapAnalysis,
} from './roadmap.service.js';
export {
  isProfileSufficientForRecommendations,
  mergeProfileData,
} from './profileContext.js';
