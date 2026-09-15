import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { IntakeFormData, Project, WhiteLabelSettings } from '../lib/types';
import { DEFAULT_WHITE_LABEL } from '../lib/mockData';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ProjectsContextValue {
  projects: Project[];
  whiteLabel: WhiteLabelSettings;
  loading: boolean;
  error: string | null;
  updateWhiteLabel: (patch: Partial<WhiteLabelSettings>) => void;
  getProject: (id: string) => Project | undefined;
  createProject: (form: IntakeFormData, useWhiteLabel: boolean, markupPrice?: number) => Promise<Project>;
  refreshProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiProject(apiProject: any): Project {
  return {
    id: apiProject.id,
    siteUrl: apiProject.site_url,
    clientName: apiProject.client_name,
    clientEmail: apiProject.client_email,
    builderTool: apiProject.builder_tool,
    agencyNotes: apiProject.agency_notes,
    status: apiProject.status,
    complexityScore: apiProject.complexity_score,
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    fixes: apiProject.fixes || [],
    patchLog: apiProject.patch_log || [],
    whiteLabel: apiProject.white_label,
    markupPrice: apiProject.markup_price,
    rejectionReasons: apiProject.rejection_reasons,
    customWorkFlag: apiProject.custom_work_flag,
    hoursSaved: apiProject.hours_saved,
    turnaroundHours: apiProject.turnaround_hours,
    knownIssues: apiProject.known_issues || [],
  };
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { authHeaders } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelSettings>(() => {
    const saved = localStorage.getItem('livecheck_whitelabel_v1');
    if (saved) {
      try {
        return { ...DEFAULT_WHITE_LABEL, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return DEFAULT_WHITE_LABEL;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.map(mapApiProject));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    localStorage.setItem('livecheck_whitelabel_v1', JSON.stringify(whiteLabel));
  }, [whiteLabel]);

  const createProject = useCallback(
    async (form: IntakeFormData, useWhiteLabel: boolean, markupPrice?: number): Promise<Project> => {
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          url: form.siteUrl,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          builderTool: form.builderTool,
          agencyNotes: form.agencyNotes,
          knownIssues: form.knownIssues,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Scan failed');
      }

      const { projectId, score } = await res.json();

      const project: Project = {
        id: projectId,
        siteUrl: form.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        builderTool: form.builderTool,
        agencyNotes: form.agencyNotes || undefined,
        status: 'scanned',
        complexityScore: score,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        whiteLabel: useWhiteLabel,
        markupPrice: useWhiteLabel ? markupPrice : undefined,
        hoursSaved: 0,
        knownIssues: form.knownIssues,
        fixes: [],
        patchLog: [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            fixKey: 'system',
            message: `Real website scan completed. Score: ${score}/100`,
            automated: true,
          },
        ],
      };

      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [API_BASE]
  );

  const updateWhiteLabel = useCallback((patch: Partial<WhiteLabelSettings>) => {
    setWhiteLabel((prev) => ({ ...prev, ...patch }));
  }, []);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  return (
    <ProjectsContext.Provider value={{ projects, whiteLabel, loading, error, updateWhiteLabel, getProject, createProject, refreshProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
