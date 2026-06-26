import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecommendations, regenerateRecommendations } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, SkeletonCard } from '../components/UiHelpers';

function MatchBadge({ score }) {
  const color =
    score >= 80 ? 'bg-emerald-100 text-emerald-800'
    : score >= 60 ? 'bg-primary-100 text-primary-800'
    : 'bg-amber-100 text-amber-800';
  return <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${color}`}>{score}% match</span>;
}

export default function CareerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [sufficient, setSufficient] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);

  const loadRecommendations = useCallback(async (regenerate = false) => {
    setError('');
    regenerate ? setGenerating(true) : setLoading(true);
    try {
      const { data } = regenerate ? await regenerateRecommendations() : await fetchRecommendations();
      setSufficient(data.sufficient ?? true);
      setMessage(data.message || '');
      setRecommendations(data.recommendations || []);
      setProfileCompletion(data.profileCompletion ?? 0);
      setCached(data.cached ?? false);
    } catch (err) {
      setError(getFriendlyClientError(err));
      if (!regenerate) setRecommendations([]);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    const profileUpdated = sessionStorage.getItem('profileUpdated');
    if (profileUpdated) {
      sessionStorage.removeItem('profileUpdated');
      loadRecommendations(true);
    } else {
      loadRecommendations(false);
    }
  }, [loadRecommendations]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Career recommendations</h1>
          <p className="mt-1 text-slate-600">AI-powered paths tailored to your profile. Profile completion: {profileCompletion}%</p>
          {cached && !generating && (
            <p className="mt-1 text-xs text-slate-500">Showing stored recommendations — updates only when your profile changes.</p>
          )}
        </div>
        {sufficient && (
          <button type="button" className="btn-secondary shrink-0" disabled={generating} onClick={() => loadRecommendations(true)}>
            {generating ? 'Refreshing...' : 'Refresh recommendations'}
          </button>
        )}
      </div>

      {error && <div className="mt-6"><ErrorBanner message={error} onRetry={() => loadRecommendations(true)} /></div>}

      {generating && (
        <div className="mt-8 flex items-center justify-center gap-3 text-slate-600">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span>Generating personalized recommendations...</span>
        </div>
      )}

      {!generating && sufficient === false && (
        <div className="mt-10 card">
          <p className="text-slate-600">{message || 'Complete your profile to receive personalized recommendations.'}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-primary">Edit profile</Link>
            <Link to="/chatbot" className="btn-secondary">Chat with AI</Link>
          </div>
        </div>
      )}

      {!generating && sufficient && recommendations.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {recommendations.map((rec, index) => (
            <div key={`${rec.title}-${index}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{rec.title}</h2>
                <MatchBadge score={rec.matchScore} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{rec.reason}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Required skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(rec.requiredSkills || []).map((s) => (
                      <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Skills to develop</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(rec.missingSkills || []).map((s) => (
                      <span key={s} className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {(rec.learningRoadmap || rec.roadmap || []).length > 0 && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs font-semibold uppercase text-slate-500 hover:text-primary-600">
                    Learning roadmap ({(rec.learningRoadmap || rec.roadmap).length} steps)
                  </summary>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-600">
                    {(rec.learningRoadmap || rec.roadmap).map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </details>
              )}

              {(rec.recommendedProjects || rec.projectsToBuild || []).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Projects to build</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                    {(rec.recommendedProjects || rec.projectsToBuild).map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {(rec.recommendedInternships || []).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Recommended internships</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                    {rec.recommendedInternships.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {(rec.freeLearningResources || []).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Free resources</h3>
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                    {rec.freeLearningResources.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {(rec.certifications || rec.recommendedCertifications || []).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase text-slate-500">Certifications</h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(rec.certifications || rec.recommendedCertifications).map((c) => (
                      <span key={c} className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
                {rec.salaryRange && <div><span className="font-medium">Salary: </span>{rec.salaryRange}</div>}
                {(rec.futureScope || rec.growthOutlook || rec.futureGrowth) && (
                  <div><span className="font-medium">Future scope: </span>{rec.futureScope || rec.growthOutlook || rec.futureGrowth}</div>
                )}
                {rec.demand && <div><span className="font-medium">Demand: </span>{rec.demand}</div>}
                {rec.timeToJobReady && <div><span className="font-medium">Job-ready: </span>{rec.timeToJobReady}</div>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/roadmap/${encodeURIComponent(rec.title)}`} className="btn-primary text-sm">Roadmap</Link>
                <Link to={`/skill-gap/${encodeURIComponent(rec.title)}`} className="btn-secondary text-sm">Skill gap</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
