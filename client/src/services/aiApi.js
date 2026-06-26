import api from './api';
import { cachedRequest, invalidateRequestCache } from '../utils/requestCache';

export const invalidateAiClientCache = () => invalidateRequestCache('ai:');

export const sendChatMessage = (message, sessionId) =>
  api.post('/ai/chat', { message, sessionId });

export const fetchSessions = () =>
  cachedRequest('ai:sessions', () => api.get('/ai/sessions'), 15_000);

export const fetchSession = (sessionId) =>
  cachedRequest(`ai:session:${sessionId}`, () => api.get(`/ai/session/${sessionId}`), 10_000);

export const deleteSession = (sessionId) => {
  invalidateRequestCache('ai:sessions');
  invalidateRequestCache(`ai:session:${sessionId}`);
  return api.delete(`/ai/session/${sessionId}`);
};

export const fetchAiProfile = () =>
  cachedRequest('ai:profile', () => api.get('/ai/profile'), 30_000);

export const updateAiProfile = (profile) => {
  invalidateRequestCache('ai:profile');
  return api.put('/ai/profile', profile);
};

/** GET — returns cached recommendations when profile unchanged (no Gemini call) */
export const fetchRecommendations = () =>
  cachedRequest('ai:recommendations', () => api.get('/recommendations'), 60_000);

/** POST — explicit refresh only */
export const regenerateRecommendations = () => {
  invalidateRequestCache('ai:recommendations');
  return api.post('/recommendations/refresh');
};

export const fetchDashboard = () =>
  cachedRequest('ai:dashboard', () => api.get('/ai/dashboard'), 20_000);

export const fetchUserAnalytics = () =>
  cachedRequest('ai:analytics', () => api.get('/analytics'), 30_000);

export const fetchAiRoadmap = (career) =>
  cachedRequest(
    `ai:roadmap:${career}`,
    () => api.get(`/ai/roadmap/${encodeURIComponent(career)}`),
    120_000,
  );

export const updateRoadmapProgress = (career, data) => {
  invalidateRequestCache(`ai:roadmap:${career}`);
  return api.put(`/ai/roadmap/${encodeURIComponent(career)}/progress`, data);
};

export const fetchAiSkillGap = (career) =>
  cachedRequest(
    `ai:skill-gap:${career}`,
    () => api.get(`/ai/skill-gap/${encodeURIComponent(career)}`),
    120_000,
  );

export const compareCareersAi = (careerA, careerB) =>
  api.post('/compare', { careerA, careerB });

export const fetchAiInternships = (career = '') => {
  const key = `ai:internships:${career || 'default'}`;
  return cachedRequest(key, () => api.get('/internships', { params: career ? { career } : {} }), 120_000);
};

export const fetchAiProjects = (career = '', difficulty = 'intermediate') => {
  const key = `ai:projects:${career || 'default'}:${difficulty}`;
  return cachedRequest(
    key,
    () => api.get('/projects', { params: { career, difficulty } }),
    120_000,
  );
};

export const analyzeResumeFile = (file) => {
  invalidateRequestCache('ai:resume');
  invalidateRequestCache('ai:dashboard');
  invalidateRequestCache('ai:recommendations');
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const fetchResumeAnalyses = () =>
  cachedRequest('ai:resume', () => api.get('/resume'), 30_000);

export const analyzeResumeFileLegacy = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/ai/analyze-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const fetchResumeAnalysesLegacy = () => api.get('/ai/resume-analyses');
