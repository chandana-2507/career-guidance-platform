import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';

import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CareerRecommendations from './pages/CareerRecommendations';
import Roadmap from './pages/Roadmap';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import SkillGap from './pages/SkillGap';
import Chatbot from './pages/Chatbot';
import Internships from './pages/Internships';
import CareerComparison from './pages/CareerComparison';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="careers" element={<ProtectedRoute><CareerRecommendations /></ProtectedRoute>} />
        <Route path="roadmap/:career" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
        <Route path="skill-gap/:career" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
        <Route path="chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="internships/:career?" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
        <Route path="compare" element={<ProtectedRoute><CareerComparison /></ProtectedRoute>} />
        <Route path="projects/:career?" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
