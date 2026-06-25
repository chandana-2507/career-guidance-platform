import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import CareerAssistantChat from './CareerAssistantChat';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-primary-600">
            CareerGuide
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-slate-600 hover:text-primary-600">Home</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-600 hover:text-primary-600">Dashboard</Link>
                <Link to="/careers" className="text-slate-600 hover:text-primary-600">Careers</Link>
                <Link to="/chatbot" className="text-slate-600 hover:text-primary-600">AI Counselor</Link>
                <Link to="/internships" className="text-slate-600 hover:text-primary-600">Internships</Link>
                <Link to="/compare" className="text-slate-600 hover:text-primary-600">Compare</Link>
                <Link to="/projects" className="text-slate-600 hover:text-primary-600">Projects</Link>
                <Link to="/analytics" className="text-slate-600 hover:text-primary-600">Analytics</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-amber-600 hover:text-amber-700">Admin</Link>
                )}
                <Link to="/profile" className="text-slate-600 hover:text-primary-600">Profile</Link>
                <button onClick={logout} className="btn-secondary text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-primary-600">Login</Link>
                <Link to="/signup" className="btn-primary">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Career Guidance Platform. Built for students.
        </div>
      </footer>
      <CareerAssistantChat />
    </div>
  );
}
