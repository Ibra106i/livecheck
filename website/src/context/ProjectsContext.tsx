import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { IntakeFormData, Project, WhiteLabelSettings } from '../lib/types';
import { DEFAULT_WHITE_LABEL, FIXES, PATCH_MESSAGES, SEED_PROJECTS } from '../lib/mockData';
import { runPreIntakeAudit } from '../lib/audit';
import { uid } from '../lib/utils';

const PROJECTS_KEY = 'livecheck_projects_v1';
const WHITE_LABEL_KEY = 'livecheck_whitelabel_v1';

interface ProjectsContextValue {
  projects: Project[];
  whiteLabel: WhiteLabelSettings;
  updateWhiteLabel: (patch: Partial<WhiteLabelSettings>) => void;
  getProject: (id: string) => Project | undefined;
  createProject: (form: IntakeFormData, useWhiteLabel: boolean, markupPrice?: number) => Project;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return SEED_PROJECTS;
}

function loadWhiteLabel(): WhiteLabelSettings {
  try {
    const raw = localStorage.getItem(WHITE_LABEL_KEY);
    if (raw) return { ...DEFAULT_WHITE_LABEL, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_WHITE_LABEL;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelSettings>(loadWhiteLabel);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(WHITE_LABEL_KEY, JSON.stringify(whiteLabel));
  }, [whiteLabel]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const patchProject = useCallback((id: string, updater: (p: Project) => Project) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }, []);

  const scheduleAutoPatch = useCallback(
    (projectId: string) => {
      const order = FIXES.map((f) => f.key);
      let delay = 1400;

      order.forEach((fixKey, idx) => {
        const startTimer = window.setTimeout(() => {
          patchProject(projectId, (p) => ({
            ...p,
            updatedAt: new Date().toISOString(),
            fixes: p.fixes.map((f) => (f.key === fixKey ? { ...f, status: 'in_progress' } : f)),
          }));
        }, delay);
        timers.current.push(startTimer);
        delay += 1600;

        const doneTimer = window.setTimeout(() => {
          const messages = PATCH_MESSAGES[fixKey] || [];
          const message = messages[Math.floor(Math.random() * messages.length)] || 'Automated patch applied.';
          patchProject(projectId, (p) => ({
            ...p,
            updatedAt: new Date().toISOString(),
            fixes: p.fixes.map((f) => (f.key === fixKey ? { ...f, status: 'done' } : f)),
            patchLog: [
              ...p.patchLog,
              { id: uid('log'), timestamp: new Date().toISOString(), fixKey, message, automated: true },
            ],
          }));

          if (idx === order.length - 1) {
            const reviewTimer = window.setTimeout(() => {
              patchProject(projectId, (p) => ({
                ...p,
                status: 'in_review',
                updatedAt: new Date().toISOString(),
                patchLog: [
                  ...p.patchLog,
                  {
                    id: uid('log'),
                    timestamp: new Date().toISOString(),
                    fixKey: 'system',
                    message: 'Automated patch pass complete (80%+ of common issues resolved). Routed to human QA for sign-off.',
                    automated: true,
                  },
                ],
              }));
              timers.current.push(reviewTimer);
            }, 1800);

            const deliverTimer = window.setTimeout(() => {
              patchProject(projectId, (p) => ({
                ...p,
                status: 'delivered',
                updatedAt: new Date().toISOString(),
                hoursSaved: p.hoursSaved || 18 + Math.floor(Math.random() * 12),
                turnaroundHours: p.turnaroundHours || 24 + Math.floor(Math.random() * 20),
                patchLog: [
                  ...p.patchLog,
                  {
                    id: uid('log'),
                    timestamp: new Date().toISOString(),
                    fixKey: 'system',
                    message: 'Human QA sign-off complete. White-label SLA certificate generated and ready for download.',
                    automated: false,
                  },
                ],
              }));
            }, 5200);
            timers.current.push(deliverTimer);
          }
        }, delay);
        timers.current.push(doneTimer);
        delay += 900;
      });
    },
    [patchProject]
  );

  const createProject = useCallback(
    (form: IntakeFormData, useWhiteLabel: boolean, markupPrice?: number): Project => {
      const verdict = runPreIntakeAudit(form);
      const id = `lc-${1100 + Math.floor(Math.random() * 8899)}`;
      const now = new Date().toISOString();

      const project: Project = {
        id,
        siteUrl: form.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        builderTool: form.builderTool,
        agencyNotes: form.agencyNotes || undefined,
        status: verdict.accepted ? 'auto_patching' : 'rejected',
        complexityScore: verdict.score,
        createdAt: now,
        updatedAt: now,
        whiteLabel: verdict.accepted ? useWhiteLabel : false,
        markupPrice: verdict.accepted && useWhiteLabel ? markupPrice : undefined,
        customWorkFlag: !verdict.accepted,
        rejectionReasons: verdict.accepted ? undefined : verdict.reasons,
        hoursSaved: 0,
        knownIssues: form.knownIssues,
        fixes: FIXES.map((f) => ({ key: f.key, status: 'pending' as const })),
        patchLog: [
          {
            id: uid('log'),
            timestamp: now,
            fixKey: 'system',
            message: verdict.accepted
              ? `Pre-intake audit passed — complexity score ${verdict.score}/100. Package auto-approved and queued for automated patching.`
              : `Pre-intake audit failed — complexity score ${verdict.score}/100. Auto-rejected before human review to avoid unprofitable scope creep.`,
            automated: true,
          },
        ],
      };

      setProjects((prev) => [project, ...prev]);

      if (verdict.accepted) {
        scheduleAutoPatch(id);
      }

      return project;
    },
    [scheduleAutoPatch]
  );

  const updateWhiteLabel = useCallback((patch: Partial<WhiteLabelSettings>) => {
    setWhiteLabel((prev) => ({ ...prev, ...patch }));
  }, []);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  return (
    <ProjectsContext.Provider value={{ projects, whiteLabel, updateWhiteLabel, getProject, createProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}
