import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function Roadmap() {
  const { career } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/roadmap/${career}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [career]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-600">Roadmap not found.</p>
        <Link to="/careers" className="mt-4 inline-block btn-primary">Back to careers</Link>
      </div>
    );
  }

  const steps = data.steps || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/careers" className="text-sm text-primary-600 hover:underline">← Careers</Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Learning roadmap: {data.career}</h1>
      <p className="mt-1 text-slate-600">Follow these steps to build your path.</p>

      <div className="mt-10">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          {steps.map((step, index) => (
            <div key={index} className="relative flex gap-6 pb-10 last:pb-0">
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
                {index + 1}
              </div>
              <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-slate-900">{step}</h3>
                <p className="mt-1 text-sm text-slate-600">Step {index + 1} in your journey.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link to={`/skill-gap/${data.slug || career}`} className="btn-primary">Check skill gap</Link>
        <Link to={`/projects/${data.slug || career}`} className="btn-secondary">Project ideas</Link>
      </div>
    </div>
  );
}
