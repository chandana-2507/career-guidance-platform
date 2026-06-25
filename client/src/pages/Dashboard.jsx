import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [resumeScore, setResumeScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/profile').then((r) => r.data.profile),
      api.get('/careers/recommend').then((r) => r.data.recommendations || []),
      api.get('/resume/analyze').then((r) => r.data.analysis).catch(() => null),
    ])
      .then(([p, rec, analysis]) => {
        setProfile(p);
        setRecommendations(rec.slice(0, 5));
        setResumeScore(analysis?.score ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const skillCount = profile?.skills?.length || 0;
  const chartData = {
    labels: recommendations.map((r) => r.career_name?.slice(0, 12) || ''),
    datasets: [
      {
        label: 'Match %',
        data: recommendations.map((r) => r.matchPercent || 0),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
      },
    ],
  };
  const doughnutData = {
    labels: ['Profile complete', 'Resume', 'Skills'],
    datasets: [
      {
        data: [
          (profile?.college && profile?.degree ? 33 : 0) + (skillCount > 0 ? 33 : 0) + (profile?.careerGoals ? 34 : 0),
          resumeScore ?? 0,
          Math.min(100, skillCount * 10),
        ].map((v) => v || 1),
        backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b'],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-600">Welcome back. Here’s your career overview.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500">Profile</p>
          <p className="text-2xl font-bold text-slate-900">{profile?.name || '—'}</p>
          <Link to="/profile" className="mt-2 text-sm text-primary-600 hover:underline">Edit profile</Link>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Skills</p>
          <p className="text-2xl font-bold text-slate-900">{skillCount}</p>
          <Link to="/profile" className="mt-2 text-sm text-primary-600 hover:underline">Add skills</Link>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Resume score</p>
          <p className="text-2xl font-bold text-slate-900">{resumeScore != null ? `${resumeScore}/100` : '—'}</p>
          <Link to="/resume" className="mt-2 text-sm text-primary-600 hover:underline">Analyze resume</Link>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Top career</p>
          <p className="text-lg font-bold text-slate-900 truncate">{recommendations[0]?.career_name || '—'}</p>
          <Link to="/careers" className="mt-2 text-sm text-primary-600 hover:underline">View all</Link>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900">Career match</h2>
          <div className="mt-4 h-64">
            {recommendations.length > 0 ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 } },
                }}
              />
            ) : (
              <p className="text-slate-500">Complete your profile and skills to see recommendations.</p>
            )}
          </div>
          <Link to="/careers" className="mt-2 inline-block text-sm text-primary-600 hover:underline">See recommendations →</Link>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
          <div className="mt-4 h-64 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      <div className="mt-10 card">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/careers" className="btn-primary">Career recommendations</Link>
          <Link to="/resume" className="btn-secondary">Resume analyzer</Link>
          <Link to="/chatbot" className="btn-secondary">Ask chatbot</Link>
          <Link to="/compare" className="btn-secondary">Compare careers</Link>
        </div>
      </div>
    </div>
  );
}
