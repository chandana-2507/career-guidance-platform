import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchDashboard } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner } from '../components/UiHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function StatSkeleton() {
  return (
    <div className="card animate-pulse space-y-2">
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchDashboard()
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getFriendlyClientError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rec = data?.latestRecommendation;
  const chartData = rec
    ? {
        labels: [rec.title],
        datasets: [{ label: 'Match %', data: [rec.matchScore], backgroundColor: 'rgba(37, 99, 235, 0.7)' }],
      }
    : null;

  const doughnutData = {
    labels: ['Profile', 'Learning', 'Resume'],
    datasets: [{
      data: [
        data?.profileCompletion || 0,
        data?.learningProgress || 0,
        data?.latestResumeScore || 0,
      ],
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b'],
    }],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-600">Your AI-powered career overview — loads from cache when available.</p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <div className="card">
              <p className="text-sm text-slate-500">Profile completion</p>
              <p className="text-2xl font-bold text-slate-900">{data?.profileCompletion ?? 0}%</p>
              <Link to="/profile" className="mt-2 text-sm text-primary-600 hover:underline">Edit profile</Link>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Career readiness</p>
              <p className="text-2xl font-bold text-slate-900">
                {data?.careerReadiness != null ? `${data.careerReadiness}%` : data?.careerMatchPercent != null ? `${data.careerMatchPercent}%` : '—'}
              </p>
              <Link to="/careers" className="mt-2 text-sm text-primary-600 hover:underline">View recommendations</Link>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Resume score</p>
              <p className="text-2xl font-bold text-slate-900">{data?.latestResumeScore != null ? `${data.latestResumeScore}/100` : '—'}</p>
              <Link to="/resume" className="mt-2 text-sm text-primary-600 hover:underline">Analyze resume</Link>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Top missing skill</p>
              <p className="text-lg font-bold text-slate-900 truncate">{data?.topMissingSkills?.[0] || '—'}</p>
              <Link to="/careers" className="mt-2 text-sm text-primary-600 hover:underline">See skill gaps</Link>
            </div>
          </>
        )}
      </div>

      {!loading && data?.recommendedNextAction && (
        <div className="mt-8 card border-primary-100 bg-primary-50">
          <h2 className="font-semibold text-primary-900">Recommended next action</h2>
          <p className="mt-2 text-slate-700">{data.recommendedNextAction}</p>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900">Career match</h2>
          <div className="mt-4 h-64">
            {loading ? (
              <div className="h-full animate-pulse rounded bg-slate-100" />
            ) : chartData ? (
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            ) : (
              <p className="text-slate-500">Open Career Recommendations to generate your top match.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
          <div className="mt-4 h-64 flex items-center justify-center">
            {loading ? (
              <div className="h-48 w-48 animate-pulse rounded-full bg-slate-100" />
            ) : (
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>

      {!loading && rec && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">Latest AI recommendation</h2>
          <p className="mt-1 text-lg font-medium text-primary-700">{rec.title} — {rec.matchScore}% match</p>
          <p className="mt-2 text-sm text-slate-600">{rec.reason}</p>
        </div>
      )}

      {!loading && (data?.internshipSuggestions?.length > 0 || data?.projectSuggestions?.length > 0) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {data.internshipSuggestions?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900">Internship suggestions</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {data.internshipSuggestions.map((job, i) => (
                  <li key={i}>{job.role} at {job.company}</li>
                ))}
              </ul>
              <Link to="/internships" className="mt-3 inline-block text-sm text-primary-600 hover:underline">View all →</Link>
            </div>
          )}
          {data.projectSuggestions?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-900">Project ideas</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {data.projectSuggestions.map((p, i) => (
                  <li key={i}>{p.name}</li>
                ))}
              </ul>
              <Link to="/projects" className="mt-3 inline-block text-sm text-primary-600 hover:underline">View all →</Link>
            </div>
          )}
        </div>
      )}

      {!loading && data?.latestChatSummary && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">Latest chat summary</h2>
          <p className="mt-2 text-sm text-slate-600">{data.latestChatSummary}...</p>
          <Link to="/chatbot" className="mt-2 inline-block text-sm text-primary-600 hover:underline">Continue chat →</Link>
        </div>
      )}

      {!loading && data?.recentActivity?.length > 0 && (
        <div className="mt-8 card">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {data.recentActivity.map((item, i) => (
              <li key={i} className="flex justify-between text-sm text-slate-600">
                <span>{item.title}</span>
                <span>{new Date(item.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 card">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link to="/careers" className="btn-primary">Career recommendations</Link>
          <Link to="/resume" className="btn-secondary">Resume analyzer</Link>
          <Link to="/chatbot" className="btn-secondary">AI Counselor</Link>
          <Link to="/compare" className="btn-secondary">Compare careers</Link>
          <Link to="/analytics" className="btn-secondary">Analytics</Link>
        </div>
      </div>
    </div>
  );
}
