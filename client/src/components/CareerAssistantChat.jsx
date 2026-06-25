import { useEffect, useRef, useState } from 'react';
import { useAiChat } from '../hooks/useAiChat';

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function MinimizeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function MessageList({ messages, loading, bottomRef }) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((msg, index) => (
        <div
          key={`${msg.role}-${index}`}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-slate-100 px-4 py-2">
            <LoadingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatComposer({ input, setInput, onSend, loading, disabled }) {
  const handleSend = () => {
    if (!input.trim() || loading || disabled) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="border-t border-slate-200 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Ask about careers, skills, certifications, salaries..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading || disabled}
        />
        <button
          type="button"
          onClick={handleSend}
          className="btn-primary px-3"
          disabled={loading || disabled || !input.trim()}
          aria-label="Send message"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AiChatInterface({
  variant = 'page',
  showSessionSidebar = true,
  onMinimize,
  onClose,
}) {
  const {
    messages,
    sessions,
    activeSessionId,
    loading,
    sessionsLoading,
    error,
    sendMessage,
    loadSession,
    startNewConversation,
    removeSession,
  } = useAiChat({ autoLoadSessions: showSessionSidebar });

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text) => {
    await sendMessage(text);
  };

  const panelClass =
    variant === 'page'
      ? 'card flex min-h-[560px] flex-col overflow-hidden lg:min-h-[620px]'
      : 'flex h-[min(520px,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl';

  return (
    <div className={variant === 'page' ? 'grid gap-6 lg:grid-cols-[260px_1fr]' : ''}>
      {showSessionSidebar && variant === 'page' && (
        <aside className="card flex max-h-[620px] flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
            <button type="button" onClick={startNewConversation} className="btn-secondary text-xs px-2 py-1">
              New
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {sessionsLoading && (
              <p className="text-xs text-slate-500">Loading sessions...</p>
            )}
            {!sessionsLoading && sessions.length === 0 && (
              <p className="text-xs text-slate-500">No conversations yet.</p>
            )}
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`group flex items-start gap-2 rounded-lg border px-3 py-2 ${
                  activeSessionId === session._id
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadSession(session._id)}
                  className="flex-1 text-left"
                >
                  <p className="line-clamp-2 text-sm font-medium text-slate-800">
                    {session.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => removeSession(session._id)}
                  className="text-xs text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <div className={panelClass}>
        {variant === 'floating' && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-primary-600 px-4 py-3 text-white">
            <div>
              <h2 className="text-sm font-semibold">CareerPilot AI</h2>
              <p className="text-xs text-primary-100">Powered by Google Gemini</p>
            </div>
            <div className="flex items-center gap-1">
              {onMinimize && (
                <button
                  type="button"
                  onClick={onMinimize}
                  className="rounded-lg p-1.5 hover:bg-primary-700"
                  aria-label="Minimize chat"
                >
                  <MinimizeIcon className="h-4 w-4" />
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 hover:bg-primary-700"
                  aria-label="Close chat"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <MessageList messages={messages} loading={loading} bottomRef={bottomRef} />
        <ChatComposer
          input={input}
          setInput={setInput}
          onSend={handleSend}
          loading={loading}
          disabled={false}
        />
      </div>
    </div>
  );
}

export default function CareerAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const openChat = () => {
    setHasOpened(true);
    setIsOpen(true);
    setIsMinimized(false);
  };

  const showPanel = isOpen && !isMinimized;

  return (
    <>
      {!showPanel && (
        <button
          type="button"
          onClick={openChat}
          className={
            isMinimized
              ? 'fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-primary-700'
              : 'fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }
          aria-label="Open CareerPilot AI"
        >
          <ChatIcon className={isMinimized ? 'h-5 w-5' : 'h-6 w-6'} />
          {isMinimized && 'CareerPilot AI'}
        </button>
      )}

      {hasOpened && (
        <div
          className={`fixed bottom-6 right-6 z-[60] w-[min(100vw-2rem,400px)] ${
            showPanel ? '' : 'pointer-events-none invisible'
          }`}
          aria-hidden={!showPanel}
        >
          <AiChatInterface
            variant="floating"
            showSessionSidebar={false}
            onMinimize={() => setIsMinimized(true)}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
