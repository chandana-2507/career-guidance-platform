import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAiSkillGap } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, LoadingSpinner } from '../components/UiHelpers';

export default function SkillGap() {
  const { career } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchAiSkillGap(career)
      .then((res) => setData(res.data))
      .catch((err) => setError(getFriendlyClientError(err)))
      .finally(() => setLoading(false));
  }, [career]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner label="Analyzing your skill gap..." />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorBanner message={error || 'Could not load skill gap.'} onRetry={load} />
        <Link to="/careers" className="mt-4 inline-block btn-primary">Back to careers</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/careers" className="text-sm text-primary-600 hover:underline">← Careers</Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Skill gap: {data.career}</h1>

      <div className="mt-8 card">
        <div className="flex items-center gap-4">
          <div className="h-4 flex-1 rounded-full bg-slate-200">
            <div className="h-4 rounded-full bg-primary-600" style={{ width: `${data.progressPercent}%` }} />
          </div>
          <span className="text-sm font-medium">{data.progressPercent}%</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">Matched skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(data.matchedSkills || []).map((s) => (
              <span key={s} className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">{s}</span>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Missing skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(data.missingSkills || []).map((s) => (
              <span key={s} className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {(data.prioritySkills || []).length > 0 && (
        <div className="mt-8 card overflow-x-auto">
          <h2 className="font-semibold text-slate-900">Priority skills</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2">Skill</th><th className="pb-2">Priority</th><th className="pb-2">Difficulty</th><th className="pb-2">Est. weeks</th>
              </tr>
            </thead>
            <tbody>
              {data.prioritySkills.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2">{row.skill}</td>
                  <td className="py-2">{row.priority}</td>
                  <td className="py-2">{row.difficulty}</td>
                  <td className="py-2">{row.estimatedWeeks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data.aiSuggestions || []).length > 0 && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">AI suggestions</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {data.aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {(data.recommendedResources || []).length > 0 && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">Recommended resources</h2>
          <ul className="mt-3 space-y-2">
            {data.recommendedResources.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{r.title}</a>
                {r.type && <span className="ml-2 text-xs text-slate-500">({r.type})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link to={`/roadmap/${encodeURIComponent(career)}`} className="btn-primary">View roadmap</Link>
        <Link to="/profile" className="btn-secondary">Update profile</Link>
      </div>
    </div>
  );
}
