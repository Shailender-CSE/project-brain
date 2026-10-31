import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/common/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import Intro from '../pages/Intro';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import KnowledgeSources from '../pages/KnowledgeSources';
import Assistant from '../pages/Assistant';
import CommitHistory from '../pages/CommitHistory';
import Settings from '../pages/Settings';
import ProjectKnowledge from '../pages/ProjectKnowledge';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/intro" element={<Intro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<Navigate to="/intro" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/knowledge" element={<KnowledgeSources />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/commits" element={<CommitHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/project-knowledge" element={<ProjectKnowledge />} />
          <Route path="/project-knowledge/:projectId" element={<ProjectKnowledge />} />
        </Route>
      </Route>
    </Routes>
  );
}
