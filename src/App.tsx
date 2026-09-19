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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <span className="text-xs font-semibold">Connecting to PropKart Pool Desk...</span>
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
      return { title: 'Property Dossier', subtitle: 'Review verified property details, media, and location' };
    }
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Property Pool Dashboard', subtitle: 'Real-time property inflow, verification and pool metrics' };
      case 'submissions':
        return { title: 'Live Property Pool', subtitle: 'Verified property registrations directly in database' };
      case 'form_builder':
        return { title: 'Dynamic Form Builder', subtitle: 'Customize public registration fields, sections, and rules' };
      case 'audit_logs':
        return { title: 'System Audit Trail', subtitle: 'Complete activity history and compliance record' };
      default:
        return { title: 'PropKart Panel', subtitle: 'Property Pool Portal' };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="h-screen w-full flex bg-slate-50 text-slate-900 overflow-hidden">
      {/* Adjustable, Non-Scrollable Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

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
