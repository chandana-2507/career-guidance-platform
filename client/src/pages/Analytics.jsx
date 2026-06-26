import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchUserAnalytics } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, LoadingSpinner } from '../components/UiHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetchUserAnalytics()
      .then((res) => setData(res.data))
      .catch((err) => setError(getFriendlyClientError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner label="Loading analytics..." />;
  if (error && !data) return <div className="mx-auto max-w-7xl px-4 py-8"><ErrorBanner message={error} onRetry={load} /></div>;

  const skillsChart = {
    labels: (data?.skillDistribution || []).slice(0, 10).map((s) => s.name),
    datasets: [{ label: 'Your skills', data: (data?.skillDistribution || []).slice(0, 10).map(() => 1), backgroundColor: 'rgba(59, 130, 246, 0.7)' }],
  };

  const resumeChart = {
    labels: (data?.resumeScores || []).map((r) => new Date(r.date).toLocaleDateString()),
    datasets: [
      { label: 'Overall', data: (data?.resumeScores || []).map((r) => r.overallScore), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)' },
      { label: 'ATS', data: (data?.resumeScores || []).map((r) => r.atsScore), borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)' },
    ],
  };

  const matchChart = {
    labels: (data?.recommendationHistory || []).map((r) => r.title?.slice(0, 15)),
    datasets: [{ label: 'Match %', data: data?.careerMatchTrend || [], backgroundColor: 'rgba(34, 197, 94, 0.7)' }],
  };

  const readinessData = {
    labels: ['Profile', 'Career readiness'],
    datasets: [{ data: [data?.profileCompletion || 0, data?.careerReadiness || 0], backgroundColor: ['#3b82f6', '#22c55e'] }],
  };

  const learningChart = {
    labels: (data?.roadmapDetails || []).map((r) => r.career?.slice(0, 12) || 'Roadmap'),
    datasets: [{
      label: 'Learning progress %',
      data: (data?.roadmapDetails || []).map((r) => r.progressPercent || 0),
      backgroundColor: 'rgba(168, 85, 247, 0.7)',
    }],
  };

  const historyChart = {
    labels: (data?.recommendationTimeline || []).map((r) =>
      r.date ? new Date(r.date).toLocaleDateString() : '',
    ),
    datasets: [{
      label: 'Top match %',
      data: (data?.recommendationTimeline || []).map((r) => r.matchScore),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      tension: 0.3,
    }],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Your analytics</h1>
      <p className="mt-1 text-slate-600">Track profile completion, career readiness, and learning progress.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-sm text-slate-500">Profile completion</p>
          <p className="text-3xl font-bold text-primary-600">{data?.profileCompletion ?? 0}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Career readiness</p>
          <p className="text-3xl font-bold text-emerald-600">{data?.careerReadiness ?? 0}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Chat sessions</p>
          <p className="text-3xl font-bold text-slate-900">{data?.chatSessionsCount ?? 0}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">Skill distribution</h2>
          <div className="mt-4 h-72">
            {(data?.skillDistribution?.length > 0) ? (
              <Bar data={skillsChart} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false }} />
            ) : <p className="text-slate-500">Add skills in your profile.</p>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Readiness overview</h2>
          <div className="mt-4 h-72 flex items-center justify-center">
            <Doughnut data={readinessData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Resume scores over time</h2>
          <div className="mt-4 h-72">
            {(data?.resumeScores?.length > 0) ? (
              <Line data={resumeChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            ) : <p className="text-slate-500">Upload a resume to track scores.</p>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Career match trend</h2>
          <div className="mt-4 h-72">
            {(data?.recommendationHistory?.length > 0) ? (
              <Bar data={matchChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            ) : <p className="text-slate-500">Generate recommendations first.</p>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Learning progress</h2>
          <div className="mt-4 h-72">
            {(data?.roadmapDetails?.length > 0) ? (
              <Bar data={learningChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            ) : <p className="text-slate-500">Start a roadmap to track learning progress.</p>}
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Recommendation history</h2>
          <div className="mt-4 h-72">
            {(data?.recommendationTimeline?.length > 0) ? (
              <Line data={historyChart} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} />
            ) : <p className="text-slate-500">Recommendation history builds as you regenerate careers.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
