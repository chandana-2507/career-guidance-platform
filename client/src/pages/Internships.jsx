import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function Internships() {
  const { career } = useParams();
  const [careers, setCareers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(career || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/careers').then((r) => setCareers(r.data.careers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const slug = selectedCareer || career;
    if (!slug) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get(`/jobs/${encodeURIComponent(slug)}`)
      .then((res) => setJobs(res.data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [selectedCareer, career]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Internships & jobs</h1>
      <p className="mt-1 text-slate-600">Opportunities for your chosen path.</p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700">Filter by career</label>
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
      ) : jobs.length === 0 ? (
        <div className="mt-10 card">
          <p className="text-slate-600">No jobs found for this career. Select another or check back later.</p>
          <Link to="/careers" className="mt-4 inline-block btn-primary">View careers</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job._id} className="card hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-slate-900">{job.role}</h2>
              <p className="text-sm text-slate-600">{job.company}</p>
              <p className="mt-1 text-sm text-slate-500">{job.location || 'Remote'}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(job.skills_required || []).slice(0, 3).map((s) => (
                  <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
                ))}
              </div>
              {job.apply_link && (
                <a
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block btn-primary text-sm"
                >
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
