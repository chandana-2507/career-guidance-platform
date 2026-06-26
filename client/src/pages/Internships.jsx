import { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAiInternships } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, LoadingSpinner, EmptyState } from '../components/UiHelpers';

export default function Internships() {
  const { career: careerParam } = useParams();
  const [career, setCareer] = useState(careerParam ? decodeURIComponent(careerParam) : '');
  const [internships, setInternships] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback((targetCareer = career) => {
    setLoading(true);
    setError('');
    fetchAiInternships(targetCareer)
      .then((res) => {
        setInternships(res.data.internships || []);
        setMeta({
          preparationRoadmap: res.data.preparationRoadmap || [],
          skillsNeeded: res.data.skillsNeeded || [],
          platforms: res.data.platforms || [],
          timeline: res.data.timeline || '',
          applicationTips: res.data.applicationTips || [],
          cached: res.data.cached,
          isDemoData: res.data.isDemoData,
        });
        setHasLoaded(true);
      })
      .catch((err) => setError(getFriendlyClientError(err)))
      .finally(() => setLoading(false));
  }, [career]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Internships & jobs</h1>
      <p className="mt-1 text-slate-600">AI-recommended opportunities based on your profile. Results are cached until your profile changes.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="input max-w-md"
          placeholder="Target career (optional)"
          value={career}
          onChange={(e) => setCareer(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => load(career)} disabled={loading}>
          {loading ? 'Loading...' : hasLoaded ? 'Refresh' : 'Find internships'}
        </button>
      </div>

      {meta.cached && hasLoaded && (
        <p className="mt-3 text-xs text-slate-500">Loaded from cache — no new AI call needed.</p>
      )}

      {(meta.isDemoData ?? true) && internships.length > 0 && (
        <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 inline-block">
          Sample recommendations for demo — structured for future live API integration.
        </p>
      )}

      {error && <div className="mt-6"><ErrorBanner message={error} onRetry={() => load(career)} /></div>}
      {loading && <LoadingSpinner label="Finding matching internships..." />}

      {!loading && !hasLoaded && !error && (
        <div className="mt-10">
          <EmptyState
            title="Ready when you are"
            description="Click Find internships to load AI recommendations. We cache results so repeat visits are instant."
            action={<button type="button" className="btn-primary" onClick={() => load(career)}>Find internships</button>}
          />
        </div>
      )}

      {!loading && hasLoaded && internships.length === 0 && !error && (
        <div className="mt-10 card">
          <p className="text-slate-600">No internships found. Try a different career keyword.</p>
          <Link to="/careers" className="mt-4 inline-block btn-primary">View careers</Link>
        </div>
      )}

      {!loading && internships.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {internships.map((job, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-slate-900">{job.role}</h2>
              <p className="text-sm text-slate-600">{job.company}</p>
              <p className="mt-1 text-sm text-slate-500">{job.location} · {job.duration}</p>
              <p className="mt-1 text-sm font-medium text-emerald-700">{job.stipend}</p>
              <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs">{job.difficulty}</span>
              <div className="mt-2 flex flex-wrap gap-1">
                {(job.requiredSkills || []).slice(0, 4).map((s) => (
                  <span key={s} className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{s}</span>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600">{job.matchReason}</p>
              {job.applicationLink && (
                <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block btn-primary text-sm">
                  Apply
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
