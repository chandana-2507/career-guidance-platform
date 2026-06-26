import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { LoadingSpinner } from './components/UiHelpers';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const CareerRecommendations = lazy(() => import('./pages/CareerRecommendations'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const Internships = lazy(() => import('./pages/Internships'));
const CareerComparison = lazy(() => import('./pages/CareerComparison'));
const Projects = lazy(() => import('./pages/Projects'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return <LoadingSpinner label="Loading page..." />;
}

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

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <LazyPage><Dashboard /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <LazyPage><Profile /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="careers"
          element={
            <ProtectedRoute>
              <LazyPage><CareerRecommendations /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="roadmap/:career"
          element={
            <ProtectedRoute>
              <LazyPage><Roadmap /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="resume"
          element={
            <ProtectedRoute>
              <LazyPage><ResumeAnalyzer /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="skill-gap/:career"
          element={
            <ProtectedRoute>
              <LazyPage><SkillGap /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="chatbot"
          element={
            <ProtectedRoute>
              <LazyPage><Chatbot /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="internships/:career?"
          element={
            <ProtectedRoute>
              <LazyPage><Internships /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="compare"
          element={
            <ProtectedRoute>
              <LazyPage><CareerComparison /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="projects/:career?"
          element={
            <ProtectedRoute>
              <LazyPage><Projects /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute>
              <LazyPage><Analytics /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <LazyPage><AdminDashboard /></LazyPage>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
