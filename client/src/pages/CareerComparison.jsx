import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CareerComparison() {
  const [careers, setCareers] = useState([]);
  const [career1, setCareer1] = useState('');
  const [career2, setCareer2] = useState('');
  const [compare, setCompare] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/careers').then((r) => setCareers(r.data.careers || [])).catch(() => {});
  }, []);

  const runCompare = () => {
    if (!career1 || !career2) return;
    setLoading(true);
    api
      .get('/careers/compare', { params: { career1, career2 } })
      .then((res) => setCompare(res.data))
      .catch(() => setCompare(null))
      .finally(() => setLoading(false));
  };

  const salaryChart = compare
    ? {
        labels: [compare.career1?.career_name, compare.career2?.career_name],
        datasets: [
          {
            label: 'Average salary',
            data: [compare.career1?.average_salary || 0, compare.career2?.average_salary || 0],
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(34, 197, 94, 0.7)'],
          },
        ],
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Compare careers</h1>
      <p className="mt-1 text-slate-600">Compare salary, demand, skills, and more.</p>

      <div className="mt-8 card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Career 1</label>
          <select
            className="input mt-1"
            value={career1}
            onChange={(e) => setCareer1(e.target.value)}
          >
            <option value="">Select</option>
            {careers.map((c) => (
              <option key={c.slug} value={c.career_name}>{c.career_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Career 2</label>
          <select
            className="input mt-1"
            value={career2}
            onChange={(e) => setCareer2(e.target.value)}
          >
            <option value="">Select</option>
            {careers.map((c) => (
              <option key={c.slug} value={c.career_name}>{c.career_name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <button onClick={runCompare} className="btn-primary" disabled={loading || !career1 || !career2}>
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {compare && (
        <>
          <div className="mt-10 card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 font-semibold text-slate-900">Field</th>
                  <th className="pb-2 font-semibold text-slate-900">{compare.career1?.career_name}</th>
                  <th className="pb-2 font-semibold text-slate-900">{compare.career2?.career_name}</th>
                </tr>
              </thead>
              <tbody>
                {(compare.compare || []).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-slate-600">{row.field}</td>
                    <td className="py-2">{String(row.value1 ?? '—')}</td>
                    <td className="py-2">{String(row.value2 ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {salaryChart && (
            <div className="mt-10 card">
              <h2 className="font-semibold text-slate-900">Salary comparison</h2>
              <div className="mt-4 h-64">
                <Bar
                  data={salaryChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
