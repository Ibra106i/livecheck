import type { AuditVerdict, IntakeFormData } from './types';

export function runPreIntakeAudit(data: IntakeFormData): AuditVerdict {
  let score = 8;
  const reasons: string[] = [];
  const positives: string[] = [];

  if (data.customBackend) {
    score += 34;
    reasons.push(
      'Custom backend or third-party API integration reported (payments, CRM, booking, or inventory systems) — outside the fixed 5-item package.'
    );
  } else {
    positives.push('No custom backend or API integration reported.');
  }

  if (data.ecommerce) {
    score += 28;
    reasons.push('Live e-commerce payment processing detected — requires a scoped custom engagement, not the fixed package.');
  } else {
    positives.push('No live payment processing in scope.');
  }

  if (data.handCoded) {
    score += 22;
    reasons.push('Site was hand-coded or heavily customized beyond the AI builder’s template — unpredictable to patch safely at a fixed fee.');
  } else {
    positives.push('Site remains on a standard AI-builder template structure.');
  }

  if (data.multiLanguage) {
    score += 12;
  } else {
    positives.push('Single-language deployment simplifies SEO and meta remediation.');
  }

  if (data.pageCount === '16-50') score += 8;
  if (data.pageCount === '50+') {
    score += 16;
    reasons.push('Site exceeds 50 pages — volume alone pushes this past a fixed-fee scope.');
  }

  if (data.knownIssues.length >= 4) score += 6;

  score = Math.min(100, score);
  const accepted = score < 50;

  if (accepted) {
    positives.push(`Estimated complexity score ${score}/100 — comfortably within fixed-package scope.`);
  }

  return { score, accepted, reasons, positives };
}
