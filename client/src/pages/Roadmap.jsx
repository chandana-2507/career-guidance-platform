import { useState, useEffect, useCallback } from 'react';

import { useParams, Link } from 'react-router-dom';

import { fetchAiRoadmap, updateRoadmapProgress } from '../services/aiApi';

import { getFriendlyClientError } from '../utils/aiErrors';

import { ErrorBanner, LoadingSpinner } from '../components/UiHelpers';



const LEVEL_KEYS = ['beginner', 'intermediate', 'advanced'];

const SECTIONS = [

  { key: 'skills', label: 'Skills' },

  { key: 'courses', label: 'Courses' },

  { key: 'projects', label: 'Projects' },

  { key: 'books', label: 'Books' },

  { key: 'certifications', label: 'Certifications' },

  { key: 'practicePlatforms', label: 'Practice platforms' },

  { key: 'interviewPrep', label: 'Interview prep' },

];



function ExpandableSection({ title, children, defaultOpen = false }) {

  const [open, setOpen] = useState(defaultOpen);

  return (

    <div className="card">

      <button

        type="button"

        className="flex w-full items-center justify-between text-left font-medium text-slate-900"

        onClick={() => setOpen((o) => !o)}

      >

        {title}

        <span className="text-slate-400">{open ? '−' : '+'}</span>

      </button>

      {open && <div className="mt-3">{children}</div>}

    </div>

  );

}



export default function Roadmap() {

  const { career } = useParams();

  const [data, setData] = useState(null);

  const [completedItems, setCompletedItems] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);



  const load = useCallback(() => {

    setLoading(true);

    setError('');

    fetchAiRoadmap(career)

      .then((res) => {

        setData(res.data);

        setCompletedItems(res.data.completedItems || []);

      })

      .catch((err) => setError(getFriendlyClientError(err)))

      .finally(() => setLoading(false));

  }, [career]);



  useEffect(() => { load(); }, [load]);



  const toggleItem = async (itemKey) => {

    const next = completedItems.includes(itemKey)

      ? completedItems.filter((i) => i !== itemKey)

      : [...completedItems, itemKey];

    setCompletedItems(next);

    setSaving(true);

    try {

      const total = countItems(data?.roadmap);

      const progressPercent = total ? Math.round((next.length / total) * 100) : 0;

      await updateRoadmapProgress(career, { completedItems: next, progressPercent });

    } catch {

      setCompletedItems(completedItems);

    } finally {

      setSaving(false);

    }

  };



  function countItems(roadmap) {

    if (!roadmap) return 0;

    let c = 0;

    if (roadmap.levels) {

      for (const level of Object.values(roadmap.levels)) {

        for (const s of SECTIONS) c += level?.[s.key]?.length || 0;

      }

    }

    (roadmap.weekMilestones || []).forEach((w) => { c += (w.tasks || []).length; });

    return c;

  }



  if (loading) return <LoadingSpinner label="Loading your personalized roadmap..." />;

  if (error || !data?.roadmap) {

    return (

      <div className="mx-auto max-w-3xl px-4 py-16">

        <ErrorBanner message={error || 'Roadmap not found.'} onRetry={load} />

        <Link to="/careers" className="mt-4 inline-block btn-primary">Back to careers</Link>

      </div>

    );

  }



  const roadmap = data.roadmap;

  const total = countItems(roadmap);

  const progressPercent = total ? Math.round((completedItems.length / total) * 100) : data.progressPercent;



  const listSection = (items, prefix) => (

    <ul className="space-y-2">

      {items.map((item, i) => {

        const itemKey = `${prefix}:${item}`;

        const done = completedItems.includes(itemKey);

        return (

          <li key={i} className="flex items-start gap-2">

            <input type="checkbox" checked={done} onChange={() => toggleItem(itemKey)} className="mt-1 rounded border-slate-300 text-primary-600" />

            <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item}</span>

          </li>

        );

      })}

    </ul>

  );



  return (

    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

      <Link to="/careers" className="text-sm text-primary-600 hover:underline">← Careers</Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">Learning roadmap: {data.career}</h1>

      <p className="mt-1 text-slate-600">{roadmap.estimatedTotalDuration || 'Personalized learning path'}</p>

      {roadmap.expectedSalaryAfterCompletion && (

        <p className="mt-1 text-sm text-emerald-700">Expected salary after completion: {roadmap.expectedSalaryAfterCompletion}</p>

      )}



      <div className="mt-6 card">

        <div className="flex items-center justify-between">

          <span className="text-sm font-medium text-slate-700">Completion: {progressPercent}%</span>

          {saving && <span className="text-xs text-slate-500">Saving...</span>}

        </div>

        <div className="mt-2 h-3 rounded-full bg-slate-200">

          <div className="h-3 rounded-full bg-primary-600 transition-all" style={{ width: `${progressPercent}%` }} />

        </div>

      </div>



      <div className="mt-8 space-y-4">

        {(roadmap.learningOrder || []).length > 0 && (

          <ExpandableSection title="Learning order" defaultOpen>

            <ol className="list-inside list-decimal text-sm text-slate-600 space-y-1">

              {roadmap.learningOrder.map((item, i) => <li key={i}>{item}</li>)}

            </ol>

          </ExpandableSection>

        )}



        {(roadmap.programmingLanguages || []).length > 0 && (

          <ExpandableSection title="Programming languages">

            <div className="flex flex-wrap gap-2">

              {roadmap.programmingLanguages.map((l) => <span key={l} className="rounded bg-slate-100 px-2 py-1 text-xs">{l}</span>)}

            </div>

          </ExpandableSection>

        )}



        {(roadmap.frameworks || []).length > 0 && (

          <ExpandableSection title="Frameworks">

            <div className="flex flex-wrap gap-2">

              {roadmap.frameworks.map((f) => <span key={f} className="rounded bg-slate-100 px-2 py-1 text-xs">{f}</span>)}

            </div>

          </ExpandableSection>

        )}



        {(roadmap.semesterPlan || []).length > 0 && (

          <ExpandableSection title="Semester-wise plan">

            <div className="space-y-3">

              {roadmap.semesterPlan.map((sem, i) => (

                <div key={i}>

                  <p className="font-medium text-slate-800">{sem.semester}: {sem.focus}</p>

                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600">

                    {(sem.milestones || []).map((m, j) => <li key={j}>{m}</li>)}

                  </ul>

                </div>

              ))}

            </div>

          </ExpandableSection>

        )}



        {(roadmap.monthPlan || []).length > 0 && (

          <ExpandableSection title="Month-wise milestones">

            <div className="space-y-3">

              {roadmap.monthPlan.map((m, i) => (

                <div key={i}>

                  <p className="font-medium text-slate-800">{m.month}: {m.focus}</p>

                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600">

                    {(m.milestones || []).map((item, j) => <li key={j}>{item}</li>)}

                  </ul>

                </div>

              ))}

            </div>

          </ExpandableSection>

        )}



        {(roadmap.weekMilestones || []).length > 0 && (

          <ExpandableSection title="Week-wise milestones" defaultOpen>

            <div className="space-y-4">

              {roadmap.weekMilestones.map((w, i) => (

                <div key={i}>

                  <p className="font-medium text-slate-800">{w.week}</p>

                  {listSection(w.tasks || [], `week:${i}`)}

                </div>

              ))}

            </div>

          </ExpandableSection>

        )}



        {['projects', 'githubPortfolio', 'internships', 'interviewPreparation', 'resumePreparation', 'jobPreparation', 'freeResources', 'certifications'].map((key) => {

          const items = roadmap[key];

          if (!items?.length) return null;

          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

          return (

            <ExpandableSection key={key} title={label}>

              {Array.isArray(items) ? listSection(items, key) : <p className="text-sm text-slate-600">{items}</p>}

            </ExpandableSection>

          );

        })}

      </div>



      {LEVEL_KEYS.map((levelKey) => {

        const level = roadmap.levels?.[levelKey];

        if (!level) return null;

        return (

          <div key={levelKey} className="mt-10">

            <h2 className="text-xl font-semibold capitalize text-slate-900">{level.title || levelKey}</h2>

            <p className="text-sm text-slate-500">{level.duration}</p>

            <div className="mt-4 space-y-4">

              {SECTIONS.map(({ key, label }) => {

                const items = level[key] || [];

                if (!items.length) return null;

                return (

                  <ExpandableSection key={key} title={label}>

                    {listSection(items, `${levelKey}:${key}`)}

                  </ExpandableSection>

                );

              })}

            </div>

          </div>

        );

      })}



      <div className="mt-10 flex flex-wrap gap-4">

        <Link to={`/skill-gap/${encodeURIComponent(career)}`} className="btn-primary">Check skill gap</Link>

        <Link to={`/projects/${encodeURIComponent(career)}`} className="btn-secondary">Project ideas</Link>

      </div>

    </div>

  );

}


