import { useState } from 'react';
import { compareCareersAi } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';
import { ErrorBanner, LoadingSpinner } from '../components/UiHelpers';

export default function CareerComparison() {
  const [careerA, setCareerA] = useState('');
  const [careerB, setCareerB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const runCompare = async () => {
    if (!careerA.trim() || !careerB.trim() || loading) return;
    setLoading(true);
    setError('');
    setFromCache(false);
    try {
      const { data } = await compareCareersAi(careerA.trim(), careerB.trim());
      setResult(data);
      setFromCache(data.cached ?? false);
    } catch (err) {
      setError(getFriendlyClientError(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const cmp = result?.comparison;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Compare careers</h1>
      <p className="mt-1 text-slate-600">AI-powered side-by-side comparison personalized for you.</p>

      <div className="mt-8 card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Career A</label>
          <input className="input mt-1" placeholder="e.g. Machine Learning Engineer" value={careerA} onChange={(e) => setCareerA(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Career B</label>
          <input className="input mt-1" placeholder="e.g. Data Scientist" value={careerB} onChange={(e) => setCareerB(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <button onClick={runCompare} className="btn-primary" disabled={loading || !careerA || !careerB}>
            {loading ? 'Comparing...' : 'Compare with AI'}
          </button>
        </div>
      </div>

      {error && <div className="mt-6"><ErrorBanner message={error} onRetry={runCompare} /></div>}
      {loading && <LoadingSpinner label="AI is comparing careers..." />}

      {fromCache && cmp && !loading && (
        <p className="mt-4 text-xs text-slate-500">Loaded from cache — same comparison for your current profile.</p>
      )}

      {cmp && !loading && (
        <>
          <div className="mt-10 card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2">Factor</th>
                  <th className="pb-2">{result.careerA}</th>
                  <th className="pb-2">{result.careerB}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Salary', cmp.salary?.careerA, cmp.salary?.careerB],
                  ['Demand', cmp.demand?.careerA, cmp.demand?.careerB],
                  ['Growth', cmp.growth?.careerA, cmp.growth?.careerB],
                  ['Difficulty', cmp.difficulty?.careerA, cmp.difficulty?.careerB],
                  ['Learning time', cmp.learningTime?.careerA, cmp.learningTime?.careerB],
                  ['Work-life balance', cmp.workLifeBalance?.careerA, cmp.workLifeBalance?.careerB],
                  ['Remote opportunities', cmp.remoteOpportunities?.careerA, cmp.remoteOpportunities?.careerB],
                  ['Future scope', cmp.futureScope?.careerA, cmp.futureScope?.careerB],
                ].map(([field, a, b]) => (
                  <tr key={field} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-700">{field}</td>
                    <td className="py-2">{a || '—'}</td>
                    <td className="py-2">{b || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(cmp.requiredSkills?.careerA?.length > 0 || cmp.requiredSkills?.careerB?.length > 0) && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="card">
                <h2 className="font-semibold text-slate-900">Required skills — {result.careerA}</h2>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(cmp.requiredSkills?.careerA || []).map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="font-semibold text-slate-900">Required skills — {result.careerB}</h2>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(cmp.requiredSkills?.careerB || []).map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.aiRecommendation && (
            <div className="mt-8 card border-primary-100 bg-primary-50">
              <h2 className="font-semibold text-primary-900">AI recommendation</h2>
              <p className="mt-2 text-slate-700">{result.aiRecommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
