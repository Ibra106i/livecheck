export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}

// Single source for the pre-launch contact address; swap the domain when the
// real one is purchased (plan "Start here" step 4) and every legal page follows.
export const SUPPORT_EMAIL = 'support@livecheck.app';
export const LAST_UPDATED = '31 October 2026';

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'The agreement between you and Livecheck when using the app, website, and reports.',
    sections: [
      {
        heading: '1. The service',
        body: [
          'Livecheck audits a website you point it at and returns a scored, timestamped technical report covering DNS, SSL, SEO metadata, security headers, mobile layout, and page speed. The command-line tool is free and open source under the MIT license; the mobile app and hosted reports add scanning credits, monitoring, and optional expert review.',
          'A report is a point-in-time measurement. Websites change after they are checked, and a report describes the site exactly as it was at scan time.',
        ],
      },
      {
        heading: '2. Your account and authorization',
        body: [
          'You only submit URLs you are authorized to test. That means a site you own, or a site for which the owner has given you permission. Livecheck is a diagnostic tool, not an intrusion tool, and it never exploits, modifies, or attacks a target.',
          'You are responsible for activity under your account. Keep your sign-in credentials secure and tell us promptly at ' + SUPPORT_EMAIL + ' if you believe your account is compromised.',
        ],
      },
      {
        heading: '3. Purchases and credits',
        body: [
          'Scan credits, monitoring subscriptions, and expert reviews are sold through the Google Play billing system. Credits never expire and are pooled at the organization level. Each scan consumes one credit; scheduled scans require an active subscription.',
          'Google Play is the only purchase channel. We do not process payments on the website, and we do not direct you to a cheaper checkout inside the app.',
        ],
      },
      {
        heading: '4. Expert review scope',
        body: [
          'An expert-reviewed report covers a single URL and the standard check groups. It is analysis and written guidance only. It does not include remediation, code changes, phone or video calls, or custom engineering work. Anything beyond reviewing and annotating a report is outside scope.',
          'Expert review is delivered within the business-day window of the tier you purchased. See the SLA page for the current turnaround commitments.',
        ],
      },
      {
        heading: '5. Disclaimers',
        body: [
          'Livecheck does not certify that a site is secure, compliant, or performing. A passing or failing check is a technical observation, not a guarantee, an audit opinion, or legal advice. Automated scanning can fail because a target blocks bots, sits behind a network restriction, or is temporarily unreachable.',
          'The service is provided "as is" without warranties of any kind, to the maximum extent allowed by law.',
        ],
      },
      {
        heading: '6. Limitation of liability',
        body: [
          'To the extent permitted by law, Livecheck is not liable for indirect, incidental, or consequential damages, or for business losses arising from reliance on a report. Our total liability for any claim is limited to the amount you paid us in the twelve months before the claim.',
        ],
      },
      {
        heading: '7. Termination and changes',
        body: [
          'You may stop using Livecheck and delete your account at any time (see the account-deletion page). We may suspend access for abuse, such as scanning without authorization or attempts to bypass rate limits and SSRF protections.',
          'We may update these terms as the product changes. Material changes are announced in the app or by email before they take effect.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What we collect, why, who helps us process it, and how to get it deleted.',
    sections: [
      {
        heading: '1. Information we collect',
        body: [
          'Account data: your name and email address, used to sign you in and reach you about your reports.',
          'Purchase history: products and subscriptions you buy through Google Play, so we can grant the right credits and entitlements. We do not see or store your card details; Google handles payment.',
          'Scanning data: the URLs you submit and the report content generated for them.',
          'Device data: a push-notification token so we can tell you when a scan finishes, plus basic crash and usage analytics to keep the app reliable.',
        ],
      },
      {
        heading: '2. How we use information',
        body: [
          'We use your data only to run the service: authenticate you, grant purchases, run scans, deliver reports and alerts, and provide support. We do not sell your personal data, and we do not use report contents to train models.',
        ],
      },
      {
        heading: '3. Subprocessors',
        body: [
          'We rely on a small number of services to operate Livecheck: Clerk for authentication, Supabase for the database and file storage, Vercel for hosting, Google Play for billing and push delivery, and an email provider for notifications. If optional AI analysis is enabled for a report, the report summary is sent to a model provider to write the plain-language explanation.',
        ],
      },
      {
        heading: '4. Retention',
        body: [
          'We keep reports and history while your account is active so monitoring and drift detection can compare scans over time. Deleting your account removes your personal data and the reports tied to it, subject to backups rolling off on their normal schedule.',
        ],
      },
      {
        heading: '5. Your rights',
        body: [
          'You can access, correct, export, or delete your data. The app and your account settings cover most of this; for anything else email ' + SUPPORT_EMAIL + '. If you are in a region with additional rights (such as the EEA/UK or California), we honor them on request.',
        ],
      },
      {
        heading: '6. Security',
        body: [
          'Tenant isolation is enforced on every query, database access is service-role only, and shared reports are reachable only through a random, unguessable token. See the security page for how we limit SSRF and abuse.',
        ],
      },
      {
        heading: '7. Children',
        body: [
          'Livecheck is a business tool for adults and is not directed at children.',
        ],
      },
    ],
  },
  {
    slug: 'refunds',
    title: 'Refund Policy',
    summary: 'How refunds work for credits, subscriptions, and expert reviews.',
    sections: [
      {
        heading: 'Unused credits',
        body: [
          'Unused scan credits are refundable through Google Play. Because a credit only disappears when a scan runs, you can always see your balance before deciding.',
        ],
      },
      {
        heading: 'Used credits',
        body: [
          'Used credits are generally non-refundable. An important exception: if a scan fails because of an infrastructure problem on our side, the credit is refunded automatically. A target that is unreachable, blocks bots, or sits behind a network restriction still produces a valid failure report and does use the credit — we state this clearly before you buy so the outcome is never a surprise.',
        ],
      },
      {
        heading: 'Expert reviews',
        body: [
          'Expert reviews are refundable before the review starts. Once a reviewer begins annotating your report, the review is delivered or, if it is not delivered within the SLA, the report is refunded.',
        ],
      },
      {
        heading: 'Subscriptions',
        body: [
          'Monitoring subscriptions are managed and canceled through Google Play. You can cancel at any time; access continues to the end of the paid period and scheduled scans stop afterward, while your history is kept.',
        ],
      },
      {
        heading: 'How to request',
        body: [
          'Play purchases follow Google Play refund rules. Contact us at ' + SUPPORT_EMAIL + ' and we will help with the request and with anything our side should fix first.',
        ],
      },
    ],
  },
  {
    slug: 'security',
    title: 'Security',
    summary: 'How we isolate tenants, limit scanning abuse, and you can report an issue.',
    sections: [
      {
        heading: 'Tenant isolation',
        body: [
          'Every request is scoped to an organization, and every database query enforces that scope. Row-level security is on for all tables, and the API reaches the database through a service-role key that never leaves the server.',
        ],
      },
      {
        heading: 'Safe scanning',
        body: [
          'Scanning is read-only and passive by default. We block requests to private, loopback, and link-local addresses and guard against DNS rebinding, so a submitted URL cannot be used to reach internal networks. The app never submits forms — the form-probing mode exists only in the separately licensed CLI and is gated behind an explicit permission confirmation.',
        ],
      },
      {
        heading: 'Shared reports',
        body: [
          'Public report links use a random token with no predictable pattern. A link is only as private as the people you share it with.',
        ],
      },
      {
        heading: 'Rate limits and abuse',
        body: [
          'Requests are limited per IP, per user, and per organization to keep the service available and to stop abusive scanning. Repeated unauthorized scanning is grounds for suspension.',
        ],
      },
      {
        heading: 'Report a vulnerability',
        body: [
          'If you find a security issue in Livecheck, email ' + SUPPORT_EMAIL + ' with details. We aim to acknowledge reports promptly and will work with you on disclosure.',
        ],
      },
    ],
  },
  {
    slug: 'acceptable-use',
    title: 'Acceptable Use',
    summary: 'The few rules that keep Livecheck a legitimate diagnostic tool.',
    sections: [
      {
        heading: 'Authorized scanning only',
        body: [
          'Point Livecheck at sites you own or are explicitly permitted to test. Scanning someone else’s site without permission is not authorized use, whatever the technical result.',
        ],
      },
      {
        heading: 'No exploitation',
        body: [
          'Livecheck measures and reports; it does not attack. Do not use it or its output to exploit vulnerabilities, disrupt a service, or access data you are not entitled to see.',
        ],
      },
      {
        heading: 'No evasion or overload',
        body: [
          'Do not try to bypass SSRF protections, rate limits, or tenant isolation, and do not submit scans at a volume intended to degrade the service or the targets you point it at.',
        ],
      },
      {
        heading: 'No misleading claims',
        body: [
          'Reports must be presented as point-in-time technical observations. Do not market a report as a security certification, compliance sign-off, or guarantee.',
        ],
      },
      {
        heading: 'Enforcement',
        body: [
          'We may limit or suspend accounts that break these rules, and we may report clearly illegal activity to the appropriate authorities.',
        ],
      },
    ],
  },
  {
    slug: 'sla',
    title: 'Service Level Agreement',
    summary: 'Delivery commitments for expert-reviewed reports.',
    sections: [
      {
        heading: 'Business days',
        body: [
          'Deadlines count business days (Monday to Friday, excluding public holidays). The clock starts when your booking enters the review queue after the automated scan completes.',
        ],
      },
      {
        heading: 'Standard tier',
        body: [
          'Expert-reviewed reports on the standard tier (review_standard) are delivered within five business days of the booking.',
        ],
      },
      {
        heading: 'Priority tier',
        body: [
          'Expert-reviewed reports on the priority tier (review_priority) are delivered within two business days of the booking.',
        ],
      },
      {
        heading: 'Scope',
        body: [
          'Each review covers one URL and the standard check groups. Delivery means an annotated report with per-check notes and an overall summary. It does not include remediation or custom work.',
        ],
      },
      {
        heading: 'If we miss a deadline',
        body: [
          'If a review is not delivered within its window, it is refundable. Monitoring scans are best-effort scheduled jobs rather than an SLA guarantee; drift alerts are sent when a scheduled scan detects a meaningful score drop or new failing check.',
        ],
      },
    ],
  },
  {
    slug: 'deletion',
    title: 'Delete Your Account',
    summary: 'How to permanently remove your Livecheck account and data.',
    sections: [
      {
        heading: 'In the app',
        body: [
          'Open Account settings and choose Delete account. Confirming starts an irreversible deletion of your profile, organizations, memberships, sites, scans, reports, and scheduled jobs.',
        ],
      },
      {
        heading: 'On the web',
        body: [
          'The same deletion is available from your account settings on the website. If you cannot sign in, email ' + SUPPORT_EMAIL + ' from your account address and we will verify and process it.',
        ],
      },
      {
        heading: 'What deletion does not remove',
        body: [
          'Purchase records Google requires us to keep for accounting, and any data that is already anonymized in aggregate analytics, remain. Backups roll off on their normal schedule.',
        ],
      },
      {
        heading: 'Before you go',
        body: [
          'Cancel any active monitoring subscription through Google Play so it does not renew, and download any reports you want to keep. Deletion is immediate for the live data.',
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string | undefined): LegalDoc | undefined {
  if (!slug) return undefined;
  return LEGAL_DOCS.find((doc) => doc.slug === slug);
}
