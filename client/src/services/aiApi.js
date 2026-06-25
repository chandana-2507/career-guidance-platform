import api from './api';

export const sendChatMessage = (message, sessionId) =>
  api.post('/ai/chat', { message, sessionId });

export const fetchSessions = () => api.get('/ai/sessions');

export const fetchSession = (sessionId) => api.get(`/ai/session/${sessionId}`);

export const deleteSession = (sessionId) => api.delete(`/ai/session/${sessionId}`);

export const fetchAiProfile = () => api.get('/ai/profile');

export const updateAiProfile = (profile) => api.put('/ai/profile', profile);
