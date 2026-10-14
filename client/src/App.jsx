import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoadingSpinner } from './components/common/Button';
import { IssueFormModal } from './components/issues/IssueFormModal';
import { IssueDetailModal } from './components/issues/IssueDetailModal';
import { ProjectModal } from './components/projects/ProjectModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { IssuesPage } from './pages/IssuesPage';
import { KanbanPage } from './pages/KanbanPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Layout Route wrapper
const ProtectedAppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueToEdit, setIssueToEdit] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleIssueSaved = () => {
    setRefreshCounter((c) => c + 1);
  };

  const handleIssueUpdated = (updated) => {
    setSelectedIssue(updated);
    setRefreshCounter((c) => c + 1);
  };

  const handleIssueDeleted = () => {
    setSelectedIssue(null);
    setRefreshCounter((c) => c + 1);
  };

  const handleOpenEditFromDetail = (issue) => {
    setSelectedIssue(null);
    setIssueToEdit(issue);
    setIsNewIssueOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onOpenNewIssue={() => {
          setIssueToEdit(null);
          setIsNewIssueOpen(true);
        }}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar onOpenNewProject={() => setIsNewProjectOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  onOpenNewIssue={() => {
                    setIssueToEdit(null);
                    setIsNewIssueOpen(true);
                  }}
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                />
              }
            />
            <Route
              path="/kanban"
              element={
                <KanbanPage
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onOpenNewIssue={() => {
                    setIssueToEdit(null);
                    setIsNewIssueOpen(true);
                  }}
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                  refreshTrigger={refreshCounter}
                />
              }
            />
            <Route
              path="/issues"
              element={
                <IssuesPage
                  onSelectIssue={(issue) => setSelectedIssue(issue)}
                  onOpenNewIssue={() => {
                    setIssueToEdit(null);
                    setIsNewIssueOpen(true);
                  }}
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                  refreshTrigger={refreshCounter}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <ProjectSettingsPage
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                />
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <IssueFormModal
        isOpen={isNewIssueOpen}
        onClose={() => {
          setIsNewIssueOpen(false);
          setIssueToEdit(null);
        }}
        issueToEdit={issueToEdit}
        onIssueSaved={handleIssueSaved}
      />

      <IssueDetailModal
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        issue={selectedIssue}
        onIssueUpdated={handleIssueUpdated}
        onIssueDeleted={handleIssueDeleted}
        onOpenEdit={handleOpenEditFromDetail}
      />

      <ProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />
    </div>
  );
};

// Public Route Guard (prevents logged in users from seeing login/register)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route path="/*" element={<ProtectedAppLayout />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}
