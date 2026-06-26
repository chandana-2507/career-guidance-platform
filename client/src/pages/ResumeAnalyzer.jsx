import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeResumeFile, fetchResumeAnalyses } from '../services/aiApi';
import { getFriendlyClientError } from '../utils/aiErrors';

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt';

function ScoreRing({ score, label, barColor }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{score}/100</p>
      <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function AnalysisResults({ analysis }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="card grid gap-8 sm:grid-cols-2">
        <ScoreRing score={analysis.overallScore ?? 0} label="Overall score" barColor="bg-primary-600" />
        <ScoreRing score={analysis.atsScore ?? 0} label="ATS score" barColor="bg-emerald-600" />
      </div>

      {analysis.summary && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Summary</h2>
          <p className="mt-2 text-slate-600">{analysis.summary}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {(analysis.strengths || []).length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-900">Strengths</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
              {analysis.strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {(analysis.weaknesses || []).length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-900">Weaknesses</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
              {analysis.weaknesses.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(analysis.missingSkills || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Missing skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.missingSkills.map((skill, i) => (
              <span key={i} className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {(analysis.careerSuggestions || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Career suggestions</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.careerSuggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.improvementSuggestions || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Improvement suggestions</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.improvementSuggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {(analysis.keywordAnalysis || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Keyword analysis</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.keywordAnalysis.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {analysis.careerFit && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Career fit</h2>
          <p className="mt-2 text-slate-600">{analysis.careerFit}</p>
        </div>
      )}

      {analysis.interviewReadiness && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Interview readiness</h2>
          <p className="mt-2 text-slate-600">{analysis.interviewReadiness}</p>
        </div>
      )}

      {(analysis.missingCertifications || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Missing certifications</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.missingCertifications.map((c, i) => (
              <span key={i} className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">{c}</span>
            ))}
          </div>
        </div>
      )}

      {(analysis.missingProjects || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Missing projects</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.missingProjects.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {(analysis.recommendedCertifications || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Recommended certifications</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.recommendedCertifications.map((cert, i) => (
              <span key={i} className="rounded bg-primary-50 px-2 py-1 text-sm text-primary-700">
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {(analysis.formattingIssues || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Formatting issues</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.formattingIssues.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {(analysis.grammarSuggestions || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Grammar suggestions</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.grammarSuggestions.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {(analysis.suggestedProjects || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Suggested projects</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600">
            {analysis.suggestedProjects.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {analysis.improvedSummary && (
        <div className="card">
          <h2 className="font-semibold text-slate-900">Improved resume summary</h2>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">{analysis.improvedSummary}</p>
        </div>
      )}
    </div>
  );
}

export default function ResumeAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const loadHistory = useCallback(async (selectLatest = false) => {
    try {
      const { data } = await fetchResumeAnalyses();
      const analyses = data.analyses || [];
      setHistory(analyses);
      if (selectLatest && analyses.length > 0) {
        setAnalysis(analyses[0]);
      } else if (analyses.length > 0) {
        setAnalysis((current) => current || analyses[0]);
      }
    } catch {
      setHistory([]);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const validateFile = (file) => {
    if (!file) return 'No file selected';
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      return 'Only PDF, DOCX, and TXT files are supported';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'File must be 5 MB or smaller';
    }
    return null;
  };

  const handleAnalyze = async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSelectedFile(file);

    try {
      const { data } = await analyzeResumeFile(file);
      setAnalysis(data.analysis);
      await loadHistory(true);
    } catch (err) {
      setError(getFriendlyClientError(err, 'Resume analysis failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleAnalyze(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAnalyze(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  if (fetchLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Resume analyzer</h1>
      <p className="mt-1 text-slate-600">
        Upload your resume for AI-powered feedback on ATS readiness, skills, and improvements.
      </p>

      <div
        className={`mt-8 card cursor-pointer border-2 border-dashed transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={onFileSelect}
        />
        <div className="flex flex-col items-center py-8 text-center">
          <svg
            className="h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-4 font-medium text-slate-700">
            {loading ? 'Analyzing resume...' : 'Drag & drop your resume here'}
          </p>
          <p className="mt-1 text-sm text-slate-500">or click to browse — PDF, DOCX, or TXT (max 5 MB)</p>
          {selectedFile && !loading && (
            <p className="mt-2 text-sm text-primary-600">{selectedFile.name}</p>
          )}
          {loading && (
            <div className="mt-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {analysis && !loading && <AnalysisResults analysis={analysis} />}

      {history.length > 1 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Previous analyses</h2>
          <ul className="mt-4 space-y-2">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    analysis?.id === item.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => setAnalysis(item)}
                >
                  <span className="font-medium text-slate-800">
                    {item.fileName || 'Resume analysis'}
                  </span>
                  <span className="ml-2 text-slate-500">
                    — {item.overallScore}/100
                    {item.createdAt && ` · ${new Date(item.createdAt).toLocaleDateString()}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
