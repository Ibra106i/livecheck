import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectsProvider } from './context/ProjectsContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NewAudit from './pages/NewAudit';
import ProjectStatus from './pages/ProjectStatus';
import WhiteLabel from './pages/WhiteLabel';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ProjectsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audit" element={<NewAudit />} />
          <Route path="/projects/:id" element={<ProjectStatus />} />
          <Route path="/white-label" element={<WhiteLabel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ProjectsProvider>
  );
}

export default App;
