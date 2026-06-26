import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Your Perfect Career Path
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-100">
            AI-powered career guidance for students. Get personalized recommendations, skill gap analysis, resume feedback, and CareerPilot AI counseling.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="rounded-lg bg-white px-6 py-3 font-medium text-primary-700 shadow-lg hover:bg-primary-50 transition-colors">
                  Go to Dashboard
                </Link>
                <Link to="/profile" className="rounded-lg border-2 border-white px-6 py-3 font-medium text-white hover:bg-white/10 transition-colors">
                  Profile
                </Link>
                <Link to="/chatbot" className="rounded-lg border-2 border-white px-6 py-3 font-medium text-white hover:bg-white/10 transition-colors">
                  AI Counsellor
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="rounded-lg bg-white px-6 py-3 font-medium text-primary-700 shadow-lg hover:bg-primary-50 transition-colors">
                  Get Started
                </Link>
                <Link to="/login" className="rounded-lg border-2 border-white px-6 py-3 font-medium text-white hover:bg-white/10 transition-colors">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">What we offer</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Career Recommendations', desc: 'AI suggests careers based on your skills and interests', icon: '🎯' },
            { title: 'Learning Roadmaps', desc: 'Step-by-step paths for your chosen career', icon: '🗺️' },
            { title: 'Resume Analyzer', desc: 'Get a score and improvement suggestions', icon: '📄' },
            { title: 'Skill Gap Analysis', desc: 'See missing skills and recommended resources', icon: '📊' },
            { title: 'Career Chatbot', desc: 'Ask career questions anytime', icon: '💬' },
            { title: 'Jobs & Internships', desc: 'Opportunities matched to your path', icon: '💼' },
            { title: 'Career Comparison', desc: 'Compare salaries, demand, and skills', icon: '⚖️' },
            { title: 'Project Ideas', desc: 'Build portfolio projects for your path', icon: '🛠️' },
          ].map((item) => (
            <div key={item.title} className="card hover:shadow-md transition-shadow">
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
