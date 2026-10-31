import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));

// The authenticated shell pulls in Clerk and the project store; keep it out of
// the marketing bundle.
const AuthShell = lazy(() => import('./AuthShell'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

const ClerkLogin = lazy(() => import('./pages/ClerkLogin'));
const ClerkSignup = lazy(() => import('./pages/ClerkSignup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewAudit = lazy(() => import('./pages/NewAudit'));
const ProjectStatus = lazy(() => import('./pages/ProjectStatus'));
const WhiteLabel = lazy(() => import('./pages/WhiteLabel'));
const OrgSettings = lazy(() => import('./pages/OrgSettings'));
const SharedReport = lazy(() => import('./pages/SharedReport'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/legal" element={<Legal />} />
            <Route path="/legal/:slug" element={<Legal />} />

            <Route element={<AuthShell />}>
              <Route path="/login" element={<ClerkLogin />} />
              <Route path="/signup" element={<ClerkSignup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute>
                    <NewAudit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectStatus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/white-label"
                element={
                  <ProtectedRoute>
                    <WhiteLabel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/org"
                element={
                  <ProtectedRoute>
                    <OrgSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/audit"
                element={
                  <ProtectedRoute>
                    <AuditLog />
                  </ProtectedRoute>
                }
              />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/r/:token" element={<SharedReport />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
