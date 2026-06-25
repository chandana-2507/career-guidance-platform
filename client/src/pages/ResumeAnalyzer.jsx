import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ResumeAnalyzer() {
  const [resumeUrl, setResumeUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    api
      .get('/resume/analyze')
      .then((res) => setAnalysis(res.data.analysis))
      .catch(() => setAnalysis(null))
      .finally(() => setFetchLoading(false));
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeUrl.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const { data } = await api.post('/resume/upload', { resumeUrl: resumeUrl.trim() });
      setAnalysis({
        score: data.analysis?.score,
        suggestions: data.analysis?.suggestions || [],
        missingKeywords: data.analysis?.missingKeywords || [],
      });
    } catch {
      setAnalysis({ score: 0, suggestions: ['Upload failed. Check the URL or try again.'], missingKeywords: [] });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading && !analysis) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Resume analyzer</h1>
      <p className="mt-1 text-slate-600">Get a score and AI-powered improvement suggestions.</p>

      <div className="mt-8 card">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Resume URL</label>
            <input
              type="url"
              className="input mt-1"
              placeholder="https://drive.google.com/... or any direct PDF link"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze resume'}
          </button>
        </form>
      </div>

      {analysis && (
        <div className="mt-8 space-y-6">
          <div className="card flex flex-col items-center">
            <p className="text-sm text-slate-500">Resume score</p>
            <p className="text-5xl font-bold text-primary-600">{analysis.score}/100</p>
            <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all"
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {analysis.suggestions?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900">Suggestions</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
                {analysis.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.missingKeywords?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900">Consider adding</h2>
              <p className="mt-1 text-sm text-slate-600">Keywords that could strengthen your resume:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.missingKeywords.map((k, i) => (
                  <span key={i} className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
