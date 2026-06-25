import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function Projects() {
  const { career } = useParams();
  const [careers, setCareers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(career || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/careers').then((r) => setCareers(r.data.careers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const slug = selectedCareer || career;
    if (!slug) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/projects/${encodeURIComponent(slug)}`)
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [selectedCareer, career]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Project ideas</h1>
      <p className="mt-1 text-slate-600">Build portfolio projects for your career path.</p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700">Career</label>
        <select
          className="input mt-1 max-w-xs"
          value={selectedCareer}
          onChange={(e) => setSelectedCareer(e.target.value)}
        >
          <option value="">Select career</option>
          {careers.map((c) => (
            <option key={c.slug} value={c.slug || c.career_name}>{c.career_name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-10 card">
          <p className="text-slate-600">No projects found for this career.</p>
          <Link to="/careers" className="mt-4 inline-block btn-primary">View careers</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <div key={proj._id} className="card hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-slate-900">{proj.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{proj.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(proj.skills_gained || []).map((s) => (
                  <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
                ))}
              </div>
              <span className="mt-2 inline-block text-xs text-slate-500">{proj.difficulty}</span>
              {proj.github_example && (
                <a
                  href={proj.github_example}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm text-primary-600 hover:underline"
                >
                  Example on GitHub →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
