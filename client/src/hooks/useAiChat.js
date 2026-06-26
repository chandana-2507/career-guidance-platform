import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteSession as deleteSessionApi,
  fetchSession,
  fetchSessions,
  sendChatMessage,
} from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm CareerPilot AI, your career counselor. I'll help you explore careers, compare options, and build a learning path — starting with a few questions about your background and goals. What would you like to talk about today?",
};

export function useAiChat({ sessionId: initialSessionId = null, autoLoadSessions = true } = {}) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data } = await fetchSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(getFriendlyClientError(err, 'Failed to load conversations'));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (sessionId) => {
    if (!sessionId) {
      setActiveSessionId(null);
      setMessages([WELCOME_MESSAGE]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchSession(sessionId);
      setActiveSessionId(sessionId);
      setMessages(
        data.messages?.length
          ? data.messages.map((m) => ({ role: m.role, content: m.content }))
          : [WELCOME_MESSAGE],
      );
    } catch (err) {
      setError(getFriendlyClientError(err, 'Failed to load conversation'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoadSessions) {
      loadSessions();
    }
  }, [autoLoadSessions, loadSessions]);

  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId, loadSession]);

  const startNewConversation = useCallback(() => {
    setActiveSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return false;

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setLoading(true);
      setError(null);

      try {
        const { data } = await sendChatMessage(trimmed, activeSessionIdRef.current);
        setActiveSessionId(data.sessionId);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        if (autoLoadSessions) {
          await loadSessions();
        }
        return true;
      } catch (err) {
      setError(getFriendlyClientError(err));
      return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, loadSessions, autoLoadSessions],
  );

  const removeSession = useCallback(
    async (sessionId) => {
      try {
        await deleteSessionApi(sessionId);
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        if (activeSessionIdRef.current === sessionId) {
          startNewConversation();
        }
        return true;
      } catch (err) {
        setError(getFriendlyClientError(err, 'Failed to delete conversation'));
        return false;
      }
    },
    [startNewConversation],
  );

  return {
    messages,
    sessions,
    activeSessionId,
    loading,
    sessionsLoading,
    error,
    sendMessage,
    loadSession,
    loadSessions,
    startNewConversation,
    removeSession,
  };
}
