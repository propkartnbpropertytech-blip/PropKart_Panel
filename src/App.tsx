import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { SubmissionsList } from './pages/SubmissionsList';
import { SubmissionDetail } from './pages/SubmissionDetail';
import { FormBuilder } from './pages/FormBuilder';
import { AuditLogs } from './pages/AuditLogs';
import { Loader2 } from 'lucide-react';

const PanelContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold">Connecting to PropKart Panel Desk...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissionId(id);
    setCurrentTab('submissions');
  };

  const handleBackToSubmissions = () => {
    setSelectedSubmissionId(null);
  };

  const handleTabChange = (tab: string) => {
    setSelectedSubmissionId(null);
    setCurrentTab(tab);
  };

  const getHeaderInfo = () => {
    if (selectedSubmissionId) {
      return { title: 'Submission Operations Desk', subtitle: 'Review, verify, and enrich property lead' };
    }
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Operational Dashboard', subtitle: 'Real-time property inflow and telecaller metrics' };
      case 'submissions':
        return { title: 'Property Submissions', subtitle: 'Live property registrations received via PropKart Connect' };
      case 'form_builder':
        return { title: 'Dynamic Form Builder', subtitle: 'Customize public registration fields, sections, and rules' };
      case 'audit_logs':
        return { title: 'System Audit Trail', subtitle: 'Complete activity history and compliance record' };
      default:
        return { title: 'PropKart Panel', subtitle: 'Management Portal' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar currentTab={currentTab} onSelectTab={handleTabChange} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />

        <main className="flex-1 overflow-y-auto">
          {selectedSubmissionId ? (
            <SubmissionDetail
              submissionId={selectedSubmissionId}
              onBack={handleBackToSubmissions}
            />
          ) : currentTab === 'dashboard' ? (
            <Dashboard
              onNavigateSubmissions={() => setCurrentTab('submissions')}
              onSelectSubmission={handleSelectSubmission}
            />
          ) : currentTab === 'submissions' ? (
            <SubmissionsList onSelectSubmission={handleSelectSubmission} />
          ) : currentTab === 'form_builder' ? (
            <FormBuilder />
          ) : currentTab === 'audit_logs' ? (
            <AuditLogs />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <PanelContent />
      </RealtimeProvider>
    </AuthProvider>
  );
};

export default App;
