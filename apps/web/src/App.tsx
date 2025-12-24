import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Agents } from './pages/Agents';
import { Models } from './pages/Models';
import { Tasks } from './pages/Tasks';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Permissions, Groups, Users } from './pages/Permissions';
import { CallbackPage } from './pages/CallbackPage';
import {
  MetricsLayout,
  GpuMetricsPage,
  PerformanceTimelinePage,
  SystemResourcesPage,
} from './pages/Metrics';
import { OpenApi } from './pages/OpenApi';
import { StoragePage } from './pages/Storage';
import { useAppType } from './contexts';

// Inner routes component that uses the AppType context
function AppRoutes() {
  const { isAgentDesktop } = useAppType();

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/models" element={<Models />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/audit" element={<AuditLogs />} />
      <Route path="/permissions" element={<Permissions />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/users" element={<Users />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/open-api" element={<OpenApi />} />

      {/* Storage route - hidden in Agent Desktop (VFS has its own file browser) */}
      {!isAgentDesktop && <Route path="/storage" element={<StoragePage />} />}

      {/* Redirect /storage to dashboard in Agent Desktop */}
      {isAgentDesktop && (
        <Route path="/storage" element={<Navigate to="/" replace />} />
      )}

      {/* Metrics section with nested routes */}
      <Route path="/metrics" element={<MetricsLayout />}>
        <Route index element={<Navigate to="/metrics/gpu" replace />} />
        <Route path="gpu" element={<GpuMetricsPage />} />
        <Route path="timeline" element={<PerformanceTimelinePage />} />
        <Route path="system" element={<SystemResourcesPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Routes>
      {/* OIDC callback handler */}
      <Route path="/callback" element={<CallbackPage />} />

      {/* All routes are protected - auto-redirects to Keycloak if not authenticated */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <AppRoutes />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
