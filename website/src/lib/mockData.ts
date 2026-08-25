import type { FixItem, Project, WhiteLabelSettings } from './types';

export const PACKAGE_PRICE = 300;
export const CUSTOM_HOURLY_RATE = 185;

export const FIXES: FixItem[] = [
  {
    key: 'ssl_dns',
    label: 'SSL & DNS Configuration',
    shortLabel: 'SSL & DNS',
    description:
      "Issue and force HTTPS, resolve mixed-content warnings, and correct DNS records so the domain propagates and resolves cleanly with no browser security warnings.",
  },
  {
    key: 'form_routing',
    label: 'Form Action Routing',
    shortLabel: 'Form Routing',
    description:
      'Rewire contact, quote, and lead forms so submissions land in the client\'s real inbox or CRM instead of vanishing into a dead AI-generated endpoint.',
  },
  {
    key: 'mobile_viewport',
    label: 'Mobile Viewport Fixes',
    shortLabel: 'Mobile Viewport',
    description:
      'Correct viewport meta tags, broken breakpoints, and horizontal overflow so the site actually renders correctly on phones and tablets.',
  },
  {
    key: 'seo_meta',
    label: 'Core SEO Meta Tags',
    shortLabel: 'SEO Meta',
    description:
      'Add missing title tags, meta descriptions, canonical tags, and Open Graph data so the site is indexable and shares correctly on social.',
  },
  {
    key: 'page_speed',
    label: 'Page Speed Optimization',
    shortLabel: 'Page Speed',
    description:
      'Compress bloated hero images, defer render-blocking scripts, and strip unused builder assets that tank Core Web Vitals.',
  },
];

export const PATCH_MESSAGES: Record<string, string[]> = {
  ssl_dns: [
    'Forced HTTPS redirect at the edge and cleared mixed-content asset URLs.',
    'Reissued SSL certificate and corrected A/CNAME records at the registrar.',
    'Verified TLS handshake across www and apex domain — no warnings remain.',
  ],
  form_routing: [
    'Rewired contact form action from a dead builder endpoint to a monitored relay.',
    'Connected quote request form to client inbox with spam filtering enabled.',
    'Added confirmation response + email copy so submissions are no longer silent.',
  ],
  mobile_viewport: [
    'Fixed missing viewport meta tag causing desktop-only rendering on mobile.',
    'Resolved horizontal scroll overflow on hero and pricing sections under 480px.',
    'Rebuilt broken flex/grid breakpoints so nav collapses correctly on tablets.',
  ],
  seo_meta: [
    'Added unique title tags and meta descriptions across all indexed pages.',
    'Generated Open Graph + Twitter card tags for correct social link previews.',
    'Added canonical tags and fixed duplicate H1 usage flagged by the crawler.',
  ],
  page_speed: [
    'Compressed and lazy-loaded 14 oversized hero images (avg. 68% size reduction).',
    'Deferred three render-blocking third-party scripts injected by the builder.',
    'Removed 40+ unused CSS/JS chunks left behind by the AI builder export.',
  ],
};

function fixesAllDone(): Project['fixes'] {
  return [
    { key: 'ssl_dns', status: 'done' },
    { key: 'form_routing', status: 'done' },
    { key: 'mobile_viewport', status: 'done' },
    { key: 'seo_meta', status: 'done' },
    { key: 'page_speed', status: 'done' },
  ];
}

function iso(daysAgo: number, hoursAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

export const SEED_PROJECTS: Project[] = [
  {
    id: 'lc-1001',
    siteUrl: 'northbaydentalgroup.com',
    clientName: 'Northbay Dental Group',
    clientEmail: 'ops@northbaydentalgroup.com',
    builderTool: 'Framer AI',
    agencyNotes: 'Client-facing launch is Monday — please prioritize.',
    status: 'delivered',
    complexityScore: 22,
    createdAt: iso(9),
    updatedAt: iso(7),
    whiteLabel: true,
    markupPrice: 450,
    hoursSaved: 24,
    turnaroundHours: 30,
    fixes: fixesAllDone(),
    knownIssues: ['ssl_warning', 'forms_broken', 'seo_missing'],
    patchLog: [
      { id: 'p1', timestamp: iso(9), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 22/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(8, 20), fixKey: 'ssl_dns', message: PATCH_MESSAGES.ssl_dns[0], automated: true },
      { id: 'p3', timestamp: iso(8, 18), fixKey: 'ssl_dns', message: PATCH_MESSAGES.ssl_dns[1], automated: true },
      { id: 'p4', timestamp: iso(8, 10), fixKey: 'form_routing', message: PATCH_MESSAGES.form_routing[0], automated: true },
      { id: 'p5', timestamp: iso(8, 2), fixKey: 'seo_meta', message: PATCH_MESSAGES.seo_meta[0], automated: true },
      { id: 'p6', timestamp: iso(7, 14), fixKey: 'page_speed', message: PATCH_MESSAGES.page_speed[0], automated: true },
      { id: 'p7', timestamp: iso(7, 6), fixKey: 'system', message: 'Human QA sign-off complete. White-label SLA certificate generated for Northbay Dental Group.', automated: false },
    ],
  },
  {
    id: 'lc-1002',
    siteUrl: 'summitgearco.com',
    clientName: 'Summit Gear Co.',
    clientEmail: 'hello@summitgearco.com',
    builderTool: '10Web',
    status: 'in_review',
    complexityScore: 34,
    createdAt: iso(2, 6),
    updatedAt: iso(0, 3),
    whiteLabel: false,
    hoursSaved: 0,
    fixes: [
      { key: 'ssl_dns', status: 'done' },
      { key: 'form_routing', status: 'done' },
      { key: 'mobile_viewport', status: 'done' },
      { key: 'seo_meta', status: 'done' },
      { key: 'page_speed', status: 'flagged', note: 'Hero video exceeds 12MB — awaiting client-approved compressed replacement.' },
    ],
    knownIssues: ['mobile_broken', 'slow_load'],
    patchLog: [
      { id: 'p1', timestamp: iso(2, 6), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 34/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(2, 2), fixKey: 'mobile_viewport', message: PATCH_MESSAGES.mobile_viewport[1], automated: true },
      { id: 'p3', timestamp: iso(1, 10), fixKey: 'form_routing', message: PATCH_MESSAGES.form_routing[1], automated: true },
      { id: 'p4', timestamp: iso(1, 2), fixKey: 'ssl_dns', message: PATCH_MESSAGES.ssl_dns[2], automated: true },
      { id: 'p5', timestamp: iso(0, 5), fixKey: 'page_speed', message: 'Flagged for human review: source hero video is too large to auto-compress without visible quality loss.', automated: false },
    ],
  },
  {
    id: 'lc-1003',
    siteUrl: 'verdantyogastudio.com',
    clientName: 'Verdant Yoga Studio',
    clientEmail: 'studio@verdantyogastudio.com',
    builderTool: 'Wix ADI',
    status: 'auto_patching',
    complexityScore: 28,
    createdAt: iso(0, 5),
    updatedAt: iso(0, 1),
    whiteLabel: true,
    markupPrice: 400,
    hoursSaved: 0,
    fixes: [
      { key: 'ssl_dns', status: 'done' },
      { key: 'form_routing', status: 'done' },
      { key: 'mobile_viewport', status: 'in_progress' },
      { key: 'seo_meta', status: 'pending' },
      { key: 'page_speed', status: 'pending' },
    ],
    knownIssues: ['forms_broken', 'seo_missing', 'mobile_broken'],
    patchLog: [
      { id: 'p1', timestamp: iso(0, 5), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 28/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(0, 4), fixKey: 'ssl_dns', message: PATCH_MESSAGES.ssl_dns[0], automated: true },
      { id: 'p3', timestamp: iso(0, 3), fixKey: 'form_routing', message: PATCH_MESSAGES.form_routing[2], automated: true },
      { id: 'p4', timestamp: iso(0, 1), fixKey: 'mobile_viewport', message: 'Auto-patch script currently rebuilding responsive breakpoints.', automated: true },
    ],
  },
  {
    id: 'lc-1004',
    siteUrl: 'lakesiderealtygroup.com',
    clientName: 'Lakeside Realty Group',
    clientEmail: 'team@lakesiderealtygroup.com',
    builderTool: 'Durable',
    status: 'pending_review',
    complexityScore: 46,
    createdAt: iso(0, 2),
    updatedAt: iso(0, 2),
    whiteLabel: true,
    markupPrice: 500,
    hoursSaved: 0,
    fixes: [
      { key: 'ssl_dns', status: 'pending' },
      { key: 'form_routing', status: 'pending' },
      { key: 'mobile_viewport', status: 'pending' },
      { key: 'seo_meta', status: 'pending' },
      { key: 'page_speed', status: 'pending' },
    ],
    knownIssues: ['ssl_warning', 'seo_missing', 'slow_load'],
    patchLog: [
      { id: 'p1', timestamp: iso(0, 2), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 46/100. Queued for auto-patch, borderline complexity flagged for QA lead review before kickoff.', automated: true },
    ],
  },
  {
    id: 'lc-1005',
    siteUrl: 'trailheadoutfittersshop.com',
    clientName: 'Trailhead Outfitters',
    clientEmail: 'info@trailheadoutfittersshop.com',
    builderTool: 'Shopify AI',
    status: 'rejected',
    complexityScore: 82,
    createdAt: iso(4),
    updatedAt: iso(4),
    whiteLabel: false,
    customWorkFlag: true,
    hoursSaved: 0,
    fixes: [],
    knownIssues: ['ssl_warning', 'forms_broken'],
    rejectionReasons: [
      'Live payment processing detected (Shopify checkout) — out of scope for the fixed 5-item package.',
      'Custom inventory API integration reported at intake — requires scoped backend engagement.',
    ],
    patchLog: [
      { id: 'p1', timestamp: iso(4), fixKey: 'system', message: 'Pre-intake audit failed — complexity score 82/100. Auto-rejected before human review to avoid unprofitable scope creep.', automated: true },
    ],
  },
  {
    id: 'lc-1006',
    siteUrl: 'brightpathlaw.com',
    clientName: 'BrightPath Law Partners',
    clientEmail: 'admin@brightpathlaw.com',
    builderTool: 'Webflow AI',
    status: 'delivered',
    complexityScore: 18,
    createdAt: iso(15),
    updatedAt: iso(13),
    whiteLabel: true,
    markupPrice: 425,
    hoursSaved: 19,
    turnaroundHours: 26,
    fixes: fixesAllDone(),
    knownIssues: ['seo_missing', 'slow_load'],
    patchLog: [
      { id: 'p1', timestamp: iso(15), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 18/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(14, 10), fixKey: 'seo_meta', message: PATCH_MESSAGES.seo_meta[1], automated: true },
      { id: 'p3', timestamp: iso(14, 2), fixKey: 'page_speed', message: PATCH_MESSAGES.page_speed[1], automated: true },
      { id: 'p4', timestamp: iso(13, 8), fixKey: 'system', message: 'Human QA sign-off complete. White-label SLA certificate generated for BrightPath Law Partners.', automated: false },
    ],
  },
  {
    id: 'lc-1007',
    siteUrl: 'pixelforgecreative.com',
    clientName: 'PixelForge Creative',
    clientEmail: 'studio@pixelforgecreative.com',
    builderTool: 'Custom / Hand-coded',
    status: 'rejected',
    complexityScore: 64,
    createdAt: iso(6),
    updatedAt: iso(6),
    whiteLabel: false,
    customWorkFlag: true,
    hoursSaved: 0,
    fixes: [],
    knownIssues: ['mobile_broken', 'seo_missing', 'slow_load'],
    rejectionReasons: [
      'Site was hand-coded well beyond the AI builder template — layout is non-standard and unpredictable to patch safely.',
      'Estimated remediation time exceeds the fixed-fee package margin threshold.',
    ],
    patchLog: [
      { id: 'p1', timestamp: iso(6), fixKey: 'system', message: 'Pre-intake audit failed — complexity score 64/100. Auto-rejected before human review to avoid unprofitable scope creep.', automated: true },
    ],
  },
  {
    id: 'lc-1008',
    siteUrl: 'clearwaterdentalspa.com',
    clientName: 'Clearwater Dental Spa',
    clientEmail: 'front@clearwaterdentalspa.com',
    builderTool: '10Web',
    status: 'delivered',
    complexityScore: 24,
    createdAt: iso(20),
    updatedAt: iso(18),
    whiteLabel: true,
    markupPrice: 475,
    hoursSaved: 22,
    turnaroundHours: 34,
    fixes: fixesAllDone(),
    knownIssues: ['ssl_warning', 'mobile_broken'],
    patchLog: [
      { id: 'p1', timestamp: iso(20), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 24/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(19, 4), fixKey: 'mobile_viewport', message: PATCH_MESSAGES.mobile_viewport[2], automated: true },
      { id: 'p3', timestamp: iso(18, 6), fixKey: 'system', message: 'Human QA sign-off complete. White-label SLA certificate generated for Clearwater Dental Spa.', automated: false },
    ],
  },
  {
    id: 'lc-1009',
    siteUrl: 'ironcladfitness.com',
    clientName: 'Ironclad Fitness',
    clientEmail: 'coach@ironcladfitness.com',
    builderTool: 'Framer AI',
    status: 'delivered',
    complexityScore: 30,
    createdAt: iso(25),
    updatedAt: iso(23),
    whiteLabel: false,
    hoursSaved: 28,
    turnaroundHours: 38,
    fixes: fixesAllDone(),
    knownIssues: ['forms_broken', 'slow_load', 'seo_missing'],
    patchLog: [
      { id: 'p1', timestamp: iso(25), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 30/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(24, 4), fixKey: 'form_routing', message: PATCH_MESSAGES.form_routing[0], automated: true },
      { id: 'p3', timestamp: iso(23, 12), fixKey: 'page_speed', message: PATCH_MESSAGES.page_speed[2], automated: true },
      { id: 'p4', timestamp: iso(23, 2), fixKey: 'system', message: 'Human QA sign-off complete. Certificate generated for Ironclad Fitness.', automated: false },
    ],
  },
  {
    id: 'lc-1010',
    siteUrl: 'mapleandcoconsulting.com',
    clientName: 'Maple & Co Consulting',
    clientEmail: 'partners@mapleandcoconsulting.com',
    builderTool: 'Durable',
    status: 'delivered',
    complexityScore: 20,
    createdAt: iso(30),
    updatedAt: iso(28),
    whiteLabel: true,
    markupPrice: 440,
    hoursSaved: 21,
    turnaroundHours: 29,
    fixes: fixesAllDone(),
    knownIssues: ['seo_missing'],
    patchLog: [
      { id: 'p1', timestamp: iso(30), fixKey: 'system', message: 'Pre-intake audit passed — complexity score 20/100. Package auto-approved.', automated: true },
      { id: 'p2', timestamp: iso(29, 6), fixKey: 'seo_meta', message: PATCH_MESSAGES.seo_meta[2], automated: true },
      { id: 'p3', timestamp: iso(28, 4), fixKey: 'system', message: 'Human QA sign-off complete. White-label SLA certificate generated for Maple & Co Consulting.', automated: false },
    ],
  },
];

export const DEFAULT_WHITE_LABEL: WhiteLabelSettings = {
  agencyName: 'Northlight Digital',
  contactEmail: 'partners@northlightdigital.com',
  accentColor: '#10b981',
  logoUrl: '',
  resalePrice: 450,
  enabledByDefault: true,
};

export const KNOWN_ISSUE_OPTIONS: { key: string; label: string; fix: string }[] = [
  { key: 'ssl_warning', label: 'Browser shows "Not Secure" / SSL warning', fix: 'ssl_dns' },
  { key: 'forms_broken', label: "Forms don't send emails or notifications", fix: 'form_routing' },
  { key: 'mobile_broken', label: 'Layout looks broken or overflows on mobile', fix: 'mobile_viewport' },
  { key: 'seo_missing', label: 'Missing meta tags / not showing up in search', fix: 'seo_meta' },
  { key: 'slow_load', label: 'Site loads noticeably slowly', fix: 'page_speed' },
];

export const BUILDER_TOOLS = [
  'Framer AI',
  'Webflow AI',
  'Wix ADI',
  'Durable',
  '10Web',
  'Shopify AI',
  'Custom / Hand-coded',
  'Other AI builder',
];
