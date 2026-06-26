import { useState, useEffect } from 'react';
import api from '../services/api';
import { invalidateAiClientCache } from '../services/aiApi';
import { useToast } from '../components/Toast';

export default function Profile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: '',
    college: '',
    degree: '',
    skills: [],
    interests: [],
    careerGoals: '',
    preferredIndustry: '',
    preferredRole: '',
    branch: '',
    certifications: [],
    projects: [],
    experience: '',
    resumeUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioLinks: [],
    careerInterests: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [careerInterestInput, setCareerInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get('/profile')
      .then((res) => {
        const p = res.data.profile || {};
        setProfile({
          name: p.name || '',
          college: p.college || '',
          degree: p.degree || '',
          branch: p.branch || '',
          skills: p.skills || [],
          interests: p.interests || [],
          careerGoals: p.careerGoals || '',
          preferredIndustry: p.preferredIndustry || '',
          preferredRole: p.preferredRole || '',
          certifications: p.certifications || [],
          projects: p.projects || [],
          experience: p.experience || '',
          resumeUrl: p.resumeUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          githubUrl: p.githubUrl || '',
          portfolioLinks: p.portfolioLinks || [],
          careerInterests: p.careerInterests || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !profile.skills.includes(v)) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, v] }));
      setSkillInput('');
    }
  };
  const removeSkill = (s) => setProfile((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== s) }));

  const addInterest = () => {
    const v = interestInput.trim();
    if (v && !profile.interests.includes(v)) {
      setProfile((prev) => ({ ...prev, interests: [...prev.interests, v] }));
      setInterestInput('');
    }
  };
  const removeInterest = (i) => setProfile((prev) => ({ ...prev, interests: prev.interests.filter((x) => x !== i) }));

  const addPortfolio = () => {
    const v = portfolioInput.trim();
    if (v) {
      setProfile((prev) => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, v] }));
      setPortfolioInput('');
    }
  };
  const removePortfolio = (p) => setProfile((prev) => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter((x) => x !== p) }));

  const addCareerInterest = () => {
    const v = careerInterestInput.trim();
    if (v && !profile.careerInterests.includes(v)) {
      setProfile((prev) => ({ ...prev, careerInterests: [...prev.careerInterests, v] }));
      setCareerInterestInput('');
    }
  };
  const removeCareerInterest = (c) => setProfile((prev) => ({ ...prev, careerInterests: prev.careerInterests.filter((x) => x !== c) }));

  const addCertification = () => {
    const v = certInput.trim();
    if (v && !profile.certifications.includes(v)) {
      setProfile((prev) => ({ ...prev, certifications: [...prev.certifications, v] }));
      setCertInput('');
    }
  };
  const removeCertification = (c) => setProfile((prev) => ({ ...prev, certifications: prev.certifications.filter((x) => x !== c) }));

  const addProject = () => {
    const v = projectInput.trim();
    if (v && !profile.projects.includes(v)) {
      setProfile((prev) => ({ ...prev, projects: [...prev.projects, v] }));
      setProjectInput('');
    }
  };
  const removeProject = (p) => setProfile((prev) => ({ ...prev, projects: prev.projects.filter((x) => x !== p) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/profile/update', profile);
      invalidateAiClientCache();
      sessionStorage.setItem('profileUpdated', Date.now().toString());
      showToast('Profile saved. Recommendations refresh when you visit Careers.', 'success');
      setMessage('Profile saved.');
    } catch {
      showToast('Failed to save profile.', 'error');
      setMessage('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUrl = (e) => {
    const url = e.target.value;
    setProfile((prev) => ({ ...prev, resumeUrl: url }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <p className="mt-1 text-slate-600">Update your information for better recommendations.</p>

      <form onSubmit={handleSave} className="mt-8 space-y-6 card">
        {message && (
          <div className={`rounded-lg p-3 text-sm ${message.includes('saved') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            className="input mt-1"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">College</label>
            <input
              type="text"
              className="input mt-1"
              value={profile.college}
              onChange={(e) => setProfile((p) => ({ ...p, college: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Degree</label>
            <input
              type="text"
              className="input mt-1"
              value={profile.degree}
              onChange={(e) => setProfile((p) => ({ ...p, degree: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Branch / specialization</label>
          <input
            type="text"
            className="input mt-1"
            placeholder="e.g. Computer Science, Mechanical"
            value={profile.branch}
            onChange={(e) => setProfile((p) => ({ ...p, branch: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Skills</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800">
                {s} <button type="button" onClick={() => removeSkill(s)} className="ml-1 text-primary-600 hover:text-primary-800">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button type="button" onClick={addSkill} className="btn-secondary">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Interests</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">
                {i} <button type="button" onClick={() => removeInterest(i)} className="ml-1 hover:text-red-600">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Add interest"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            />
            <button type="button" onClick={addInterest} className="btn-secondary">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Career goals</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            value={profile.careerGoals}
            onChange={(e) => setProfile((p) => ({ ...p, careerGoals: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Preferred industry</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Technology, Healthcare"
              value={profile.preferredIndustry}
              onChange={(e) => setProfile((p) => ({ ...p, preferredIndustry: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Preferred role</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Software Engineer"
              value={profile.preferredRole}
              onChange={(e) => setProfile((p) => ({ ...p, preferredRole: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Experience</label>
          <textarea
            className="input mt-1 min-h-[60px]"
            placeholder="Internships, part-time work, volunteering..."
            value={profile.experience}
            onChange={(e) => setProfile((p) => ({ ...p, experience: e.target.value }))}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Certifications</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.certifications.map((c) => (
              <span key={c} className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
                {c} <button type="button" onClick={() => removeCertification(c)} className="ml-1">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input flex-1" placeholder="Add certification" value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())} />
            <button type="button" onClick={addCertification} className="btn-secondary">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Projects</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.projects.map((p) => (
              <span key={p} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm">
                {p} <button type="button" onClick={() => removeProject(p)} className="ml-1">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="input flex-1" placeholder="Add project" value={projectInput} onChange={(e) => setProjectInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProject())} />
            <button type="button" onClick={addProject} className="btn-secondary">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Resume URL</label>
          <input
            type="url"
            className="input mt-1"
            placeholder="https://..."
            value={profile.resumeUrl || ''}
            onChange={handleResumeUrl}
          />
          <p className="mt-1 text-xs text-slate-500">Paste a link to your resume (e.g. Google Drive) or use Resume Analyzer to upload.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">LinkedIn</label>
            <input
              type="url"
              className="input mt-1"
              value={profile.linkedinUrl}
              onChange={(e) => setProfile((p) => ({ ...p, linkedinUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">GitHub</label>
            <input
              type="url"
              className="input mt-1"
              value={profile.githubUrl}
              onChange={(e) => setProfile((p) => ({ ...p, githubUrl: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Portfolio links</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.portfolioLinks.map((url) => (
              <span key={url} className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-sm">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px]">{url}</a>
                <button type="button" onClick={() => removePortfolio(url)} className="ml-1 text-slate-500 hover:text-red-600">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              className="input flex-1"
              placeholder="https://..."
              value={portfolioInput}
              onChange={(e) => setPortfolioInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolio())}
            />
            <button type="button" onClick={addPortfolio} className="btn-secondary">Add</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Career interests</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.careerInterests.map((c) => (
              <span key={c} className="inline-flex items-center rounded-full bg-accent-100 px-3 py-1 text-sm text-accent-800">
                {c} <button type="button" onClick={() => removeCareerInterest(c)} className="ml-1">&times;</button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="e.g. Web Developer"
              value={careerInterestInput}
              onChange={(e) => setCareerInterestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCareerInterest())}
            />
            <button type="button" onClick={addCareerInterest} className="btn-secondary">Add</button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
