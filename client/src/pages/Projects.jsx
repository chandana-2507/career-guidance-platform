import { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAiProjects } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, LoadingSpinner, EmptyState } from '../components/UiHelpers';

export default function Projects() {
  const { career: careerParam } = useParams();
  const [career, setCareer] = useState(careerParam ? decodeURIComponent(careerParam) : '');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback((targetCareer = career, level = difficulty) => {
    setLoading(true);
    setError('');
    fetchAiProjects(targetCareer, level)
      .then((res) => {
        setProjects(res.data.projects || []);
        setCached(res.data.cached ?? false);
        setHasLoaded(true);
      })
      .catch((err) => setError(getFriendlyClientError(err)))
      .finally(() => setLoading(false));
  }, [career, difficulty]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">AI project ideas</h1>
      <p className="mt-1 text-slate-600">Portfolio projects tailored to your career goal. Cached until your profile changes.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input className="input max-w-md" placeholder="Target career" value={career} onChange={(e) => setCareer(e.target.value)} />
        <select className="input max-w-xs" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button type="button" className="btn-primary" onClick={() => load(career, difficulty)} disabled={loading}>
          {loading ? 'Generating...' : hasLoaded ? 'Refresh' : 'Generate ideas'}
        </button>
      </div>

      {cached && hasLoaded && <p className="mt-3 text-xs text-slate-500">Loaded from cache.</p>}

      {error && <div className="mt-6"><ErrorBanner message={error} onRetry={() => load(career, difficulty)} /></div>}
      {loading && <LoadingSpinner label="Generating project ideas..." />}

      {!loading && !hasLoaded && !error && (
        <div className="mt-10">
          <EmptyState
            title="Generate portfolio ideas"
            description="Click Generate ideas when ready. Cached results load instantly on return visits."
            action={<button type="button" className="btn-primary" onClick={() => load(career, difficulty)}>Generate ideas</button>}
          />
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-slate-900">{proj.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{proj.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(proj.technologies || []).map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{t}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 capitalize">{proj.difficulty} · {proj.estimatedDuration}</p>
              {(proj.skillsLearned || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {proj.skillsLearned.map((s) => (
                    <span key={s} className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{s}</span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-sm text-slate-600"><strong>Portfolio value:</strong> {proj.portfolioValue}</p>
              <p className="mt-1 text-sm text-slate-600"><strong>Learn:</strong> {proj.learningOutcome}</p>
              {proj.githubStructure && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-600">{proj.githubStructure}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && hasLoaded && projects.length === 0 && !error && (
        <div className="mt-10 card">
          <Link to="/careers" className="btn-primary">Get career recommendations first</Link>
        </div>
      )}
    </div>
  );
}
