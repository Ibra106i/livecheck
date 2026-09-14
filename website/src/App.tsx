import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewAudit = lazy(() => import('./pages/NewAudit'));
const ProjectStatus = lazy(() => import('./pages/ProjectStatus'));
const WhiteLabel = lazy(() => import('./pages/WhiteLabel'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
      <ProjectsProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/audit" element={<NewAudit />} />
              <Route path="/projects/:id" element={<ProjectStatus />} />
              <Route path="/white-label" element={<WhiteLabel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ProjectsProvider>
    </ErrorBoundary>
  );
}

export default App;
