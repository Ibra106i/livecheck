export type CheckStatus = 'pass' | 'fail' | 'warn' | 'skip' | 'blocked';

export type CheckGroup =
  | 'general'
  | 'dns'
  | 'ssl'
  | 'headers'
  | 'seo'
  | 'mobile'
  | 'forms'
  | 'speed';

export interface CheckResult {
  id: string;
  title: string;
  group: CheckGroup;
  status: CheckStatus;
  detail?: string;
  weight?: number;
}

export interface FetchedPage {
  status: number;
  headers: Headers;
  html: string;
  ttfbMs: number;
  isBlocked?: boolean;
  blockReason?: 'restricted-network-address';
}

export interface CheckContext {
  url: URL;
  timeoutMs: number;
  probeForms: boolean;
  useLighthouse: boolean;
  browser: BrowserLike | null;
  page: FetchedPage;
}

export interface BrowserLike {
  newContext(options?: Record<string, unknown>): Promise<BrowserContextLike>;
  close(): Promise<void>;
}

export interface BrowserContextLike {
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
  route(pattern: string, handler: (route: { request: () => { url: () => string }; abort: (errorCode?: string) => void; continue: () => void }) => Promise<void>): Promise<void>;
}

export interface PageLike {
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  waitForLoadState(state?: string, options?: Record<string, unknown>): Promise<void>;
  evaluate<T>(fn: () => T): Promise<T>;
  locator(selector: string): LocatorLike;
  on(event: string, listener: (payload: unknown) => void): void;
  close(): Promise<void>;
}

export interface LocatorLike {
  count(): Promise<number>;
  nth(index: number): LocatorLike;
  first(): LocatorLike;
  locator(selector: string): LocatorLike;
  getAttribute(name: string): Promise<string | null>;
  fill(value: string, options?: Record<string, unknown>): Promise<void>;
  click(options?: Record<string, unknown>): Promise<void>;
  evaluate<T>(fn: (element: Element) => T): Promise<T>;
}

export interface ReportSummary {
  pass: number;
  fail: number;
  warn: number;
  skip: number;
  blocked: number;
}

export interface AuditOptions {
  probeForms: boolean;
  useLighthouse: boolean;
  timeoutMs: number;
}

export interface AuditReport {
  url: string;
  startedAt: string;
  finishedAt: string;
  score: number;
  summary: ReportSummary;
  results: CheckResult[];
  aiAnalysis?: string;
}

export interface Check {
  id: string;
  title: string;
  group: CheckGroup;
  requiresBrowser: boolean;
  run(ctx: CheckContext): Promise<CheckResult[]>;
}
