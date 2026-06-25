import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function SkillGap() {
  const { career } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/skills/gap/${career}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [career]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-600">Could not load skill gap.</p>
        <Link to="/careers" className="mt-4 inline-block btn-primary">Back to careers</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/careers" className="text-sm text-primary-600 hover:underline">← Careers</Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Skill gap: {data.career}</h1>
      <p className="mt-1 text-slate-600">Your progress toward required skills.</p>

      <div className="mt-8 card">
        <h2 className="font-semibold text-slate-900">Progress</h2>
        <div className="mt-2 flex items-center gap-4">
          <div className="h-4 flex-1 rounded-full bg-slate-200">
            <div
              className="h-4 rounded-full bg-primary-600 transition-all"
              style={{ width: `${data.progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">{data.progressPercent}%</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">Your skills</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(data.userSkills || []).map((s) => (
              <li key={s} className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">{s}</li>
            ))}
            {(!data.userSkills || data.userSkills.length === 0) && (
              <li className="text-slate-500 text-sm">None added yet. Add skills in Profile.</li>
            )}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Missing skills</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(data.missingSkills || []).map((s) => (
              <li key={s} className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">{s}</li>
            ))}
            {(!data.missingSkills || data.missingSkills.length === 0) && (
              <li className="text-green-600 text-sm">You have all required skills!</li>
            )}
          </ul>
        </div>
      </div>

      {(data.recommendedResources?.length > 0) && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">Recommended resources</h2>
          <ul className="mt-3 space-y-2">
            {data.recommendedResources.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {r.title || r.url}
                </a>
                {r.type && <span className="ml-2 text-xs text-slate-500">({r.type})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <Link to={`/roadmap/${career}`} className="btn-primary">View roadmap</Link>
        <Link to="/profile" className="btn-secondary">Add skills in profile</Link>
      </div>
    </div>
  );
}
