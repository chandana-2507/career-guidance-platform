import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function CareerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/careers/recommend')
      .then((res) => setRecommendations(res.data.recommendations || []))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Career recommendations</h1>
      <p className="mt-1 text-slate-600">Based on your profile, skills, and interests.</p>

      {recommendations.length === 0 ? (
        <div className="mt-10 card">
          <p className="text-slate-600">Add skills and interests in your profile to get recommendations.</p>
          <Link to="/profile" className="mt-4 inline-block btn-primary">Edit profile</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <div key={rec._id || rec.career_name} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{rec.career_name}</h2>
                <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
                  {rec.matchPercent}% match
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{rec.description}</p>
              {rec.aiExplanation && (
                <p className="mt-2 text-sm text-slate-500 italic">"{rec.aiExplanation}"</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {(rec.required_skills || []).slice(0, 4).map((s) => (
                  <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/roadmap/${rec.slug || rec.career_name}`} className="btn-primary text-sm">Roadmap</Link>
                <Link to={`/skill-gap/${rec.slug || rec.career_name}`} className="btn-secondary text-sm">Skill gap</Link>
                <Link to={`/internships/${rec.slug || rec.career_name}`} className="btn-secondary text-sm">Jobs</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
