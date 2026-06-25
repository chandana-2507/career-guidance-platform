import { AiChatInterface } from '../components/CareerAssistantChat';

export default function Chatbot() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">CareerPilot AI</h1>
        <p className="mt-1 text-slate-600">
          Your AI career counselor — discover careers, compare options, and build learning paths
          powered by Google Gemini.
        </p>
      </div>

      <AiChatInterface variant="page" showSessionSidebar />
    </div>
  );
}
