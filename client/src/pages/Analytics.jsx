import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Analytics() {
  const [skills, setSkills] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/skills').then((r) => r.data.skills || []),
      api.get('/analytics/careers').then((r) => r.data.careers || []),
    ])
      .then(([s, c]) => {
        setSkills(s);
        setCareers(c);
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

  const skillsChart = {
    labels: skills.slice(0, 10).map((s) => s.name),
    datasets: [
      { label: 'Demand (careers)', data: skills.slice(0, 10).map((s) => s.demand), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
    ],
  };
  const careersChart = {
    labels: careers.slice(0, 10).map((c) => c.name),
    datasets: [
      { label: 'User interest count', data: careers.slice(0, 10).map((c) => c.count), backgroundColor: 'rgba(34, 197, 94, 0.7)' },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Data analytics</h1>
      <p className="mt-1 text-slate-600">Trends: most demanded skills and most selected careers.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-slate-900">Most demanded skills</h2>
          <div className="mt-4 h-80">
            <Bar
              data={skillsChart}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-900">Most selected careers</h2>
          <div className="mt-4 h-80">
            <Bar
              data={careersChart}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
