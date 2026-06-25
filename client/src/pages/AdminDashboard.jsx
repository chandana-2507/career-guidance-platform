import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [careers, setCareers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ career: {}, job: {}, project: {} });

  useEffect(() => {
    api.get('/analytics/overview').then((r) => setOverview(r.data.overview)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api.get('/admin/users').then((r) => setUsers(r.data.users || [])).catch(() => {});
    } else if (tab === 'careers') {
      api.get('/admin/careers').then((r) => setCareers(r.data.careers || [])).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    setLoading(false);
  }, [overview, users, careers]);

  const handleCreateCareer = async (e) => {
    e.preventDefault();
    const f = form.career;
    if (!f.career_name) return;
    try {
      await api.post('/admin/careers', {
        career_name: f.career_name,
        required_skills: (f.required_skills || '').split(',').map((s) => s.trim()).filter(Boolean),
        average_salary: Number(f.average_salary) || 0,
        industry_demand: f.industry_demand || 'medium',
        description: f.description,
        roadmap_steps: (f.roadmap_steps || '').split(',').map((s) => s.trim()).filter(Boolean),
      });
      setForm((prev) => ({ ...prev, career: {} }));
      if (tab === 'careers') api.get('/admin/careers').then((r) => setCareers(r.data.careers || []));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const f = form.job;
    if (!f.company || !f.role) return;
    try {
      await api.post('/admin/jobs', {
        company: f.company,
        role: f.role,
        skills_required: (f.skills_required || '').split(',').map((s) => s.trim()).filter(Boolean),
        location: f.location,
        apply_link: f.apply_link,
        career: f.career,
        careerSlug: (f.career || '').toLowerCase().replace(/\s+/g, '-'),
      });
      setForm((prev) => ({ ...prev, job: {} }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const f = form.project;
    if (!f.title) return;
    try {
      await api.post('/admin/projects', {
        title: f.title,
        description: f.description,
        career: f.career,
        careerSlug: (f.career || '').toLowerCase().replace(/\s+/g, '-'),
        skills_gained: (f.skills_gained || '').split(',').map((s) => s.trim()).filter(Boolean),
        difficulty: f.difficulty || 'intermediate',
        github_example: f.github_example,
      });
      setForm((prev) => ({ ...prev, project: {} }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="mt-1 text-slate-600">Manage users, careers, jobs, and projects.</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {['overview', 'users', 'careers', 'add career', 'add job', 'add project'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm text-slate-500">Users</p>
            <p className="text-2xl font-bold text-slate-900">{overview.userCount}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Careers</p>
            <p className="text-2xl font-bold text-slate-900">{overview.careerCount}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Resume analyses</p>
            <p className="text-2xl font-bold text-slate-900">{overview.analysisCount}</p>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-8 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-left font-semibold">Email</th>
                <th className="pb-2 text-left font-semibold">Name</th>
                <th className="pb-2 text-left font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'careers' && (
        <div className="mt-8 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-left font-semibold">Career</th>
                <th className="pb-2 text-left font-semibold">Salary</th>
                <th className="pb-2 text-left font-semibold">Demand</th>
              </tr>
            </thead>
            <tbody>
              {careers.map((c) => (
                <tr key={c._id} className="border-b border-slate-100">
                  <td className="py-2">{c.career_name}</td>
                  <td className="py-2">{c.average_salary}</td>
                  <td className="py-2">{c.industry_demand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'add career' && (
        <form onSubmit={handleCreateCareer} className="mt-8 card max-w-xl space-y-4">
          <input className="input" placeholder="Career name" value={form.career.career_name || ''} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, career_name: e.target.value } }))} required />
          <textarea className="input" placeholder="Required skills (comma-separated)" value={form.career.required_skills || ''} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, required_skills: e.target.value } }))} />
          <input type="number" className="input" placeholder="Average salary" value={form.career.average_salary || ''} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, average_salary: e.target.value } }))} />
          <select className="input" value={form.career.industry_demand || 'medium'} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, industry_demand: e.target.value } }))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very_high">Very high</option>
          </select>
          <input className="input" placeholder="Description" value={form.career.description || ''} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, description: e.target.value } }))} />
          <input className="input" placeholder="Roadmap steps (comma-separated)" value={form.career.roadmap_steps || ''} onChange={(e) => setForm((p) => ({ ...p, career: { ...p.career, roadmap_steps: e.target.value } }))} />
          <button type="submit" className="btn-primary">Add career</button>
        </form>
      )}

      {tab === 'add job' && (
        <form onSubmit={handleCreateJob} className="mt-8 card max-w-xl space-y-4">
          <input className="input" placeholder="Company" value={form.job.company || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, company: e.target.value } }))} required />
          <input className="input" placeholder="Role" value={form.job.role || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, role: e.target.value } }))} required />
          <input className="input" placeholder="Skills (comma-separated)" value={form.job.skills_required || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, skills_required: e.target.value } }))} />
          <input className="input" placeholder="Location" value={form.job.location || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, location: e.target.value } }))} />
          <input className="input" placeholder="Apply link" value={form.job.apply_link || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, apply_link: e.target.value } }))} />
          <input className="input" placeholder="Career (e.g. Web Developer)" value={form.job.career || ''} onChange={(e) => setForm((p) => ({ ...p, job: { ...p.job, career: e.target.value } }))} />
          <button type="submit" className="btn-primary">Add job</button>
        </form>
      )}

      {tab === 'add project' && (
        <form onSubmit={handleCreateProject} className="mt-8 card max-w-xl space-y-4">
          <input className="input" placeholder="Project title" value={form.project.title || ''} onChange={(e) => setForm((p) => ({ ...p, project: { ...p.project, title: e.target.value } }))} required />
          <input className="input" placeholder="Description" value={form.project.description || ''} onChange={(e) => setForm((p) => ({ ...p, project: { ...p.project, description: e.target.value } }))} />
          <input className="input" placeholder="Career" value={form.project.career || ''} onChange={(e) => setForm((p) => ({ ...p, project: { ...p.project, career: e.target.value } }))} />
          <input className="input" placeholder="Skills gained (comma-separated)" value={form.project.skills_gained || ''} onChange={(e) => setForm((p) => ({ ...p, project: { ...p.project, skills_gained: e.target.value } }))} />
          <input className="input" placeholder="GitHub example URL" value={form.project.github_example || ''} onChange={(e) => setForm((p) => ({ ...p, project: { ...p.project, github_example: e.target.value } }))} />
          <button type="submit" className="btn-primary">Add project</button>
        </form>
      )}
    </div>
  );
}
