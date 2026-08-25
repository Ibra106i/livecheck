export type FixKey =
  | 'ssl_dns'
  | 'form_routing'
  | 'mobile_viewport'
  | 'seo_meta'
  | 'page_speed';

export interface FixItem {
  key: FixKey;
  label: string;
  shortLabel: string;
  description: string;
}

export type ProjectStatus =
  | 'rejected'
  | 'pending_review'
  | 'auto_patching'
  | 'in_review'
  | 'delivered';

export interface PatchLogEntry {
  id: string;
  timestamp: string;
  fixKey: FixKey | 'system';
  message: string;
  automated: boolean;
}

export type FixStatus = 'pending' | 'in_progress' | 'done' | 'flagged';

export interface FixProgress {
  key: FixKey;
  status: FixStatus;
  note?: string;
}

export interface Project {
  id: string;
  siteUrl: string;
  clientName: string;
  clientEmail: string;
  builderTool: string;
  agencyNotes?: string;
  status: ProjectStatus;
  complexityScore: number;
  createdAt: string;
  updatedAt: string;
  fixes: FixProgress[];
  patchLog: PatchLogEntry[];
  whiteLabel: boolean;
  markupPrice?: number;
  rejectionReasons?: string[];
  customWorkFlag?: boolean;
  hoursSaved?: number;
  turnaroundHours?: number;
  knownIssues?: string[];
}

export interface WhiteLabelSettings {
  agencyName: string;
  contactEmail: string;
  accentColor: string;
  logoUrl: string;
  resalePrice: number;
  enabledByDefault: boolean;
}

export interface IntakeFormData {
  siteUrl: string;
  builderTool: string;
  clientName: string;
  clientEmail: string;
  agencyNotes: string;
  pageCount: string;
  customBackend: boolean;
  ecommerce: boolean;
  handCoded: boolean;
  multiLanguage: boolean;
  knownIssues: string[];
}

export interface AuditVerdict {
  score: number;
  accepted: boolean;
  reasons: string[];
  positives: string[];
}
