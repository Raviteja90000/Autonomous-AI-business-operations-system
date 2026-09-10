import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { SplashProvider, useSplash } from './context/SplashContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SplashScreen } from './components/common/SplashScreen';

import { DashboardPage } from './pages/DashboardPage';
import { ExecutivePage } from './pages/ExecutivePage';
import { CyclesPage } from './pages/CyclesPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ActionsPage } from './pages/ActionsPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { AgentsPage } from './pages/AgentsPage';
import { MemoryPage } from './pages/MemoryPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AuditPage } from './pages/AuditPage';
import { HealthPage } from './pages/HealthPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E0D] text-[#DFB59D] font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-[#C5855A] border-t-transparent animate-spin" />
          <span>Synchronizing Auren Operations session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-[#EFECE6] text-[#1C1917]">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-hidden bg-[#EFECE6]">
        <Header onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { showSplash, closeSplash } = useSplash();

  return (
    <>
      {showSplash && <SplashScreen onComplete={closeSplash} minDurationMs={2400} />}
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/executive" element={<ExecutivePage />} />
              <Route path="/cycles" element={<CyclesPage />} />
              <Route path="/decisions" element={<DecisionsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/evaluations" element={<EvaluationsPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SplashProvider>
        <AppContent />
      </SplashProvider>
    </BrowserRouter>
  );
};

export default App;
