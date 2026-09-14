import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface ScanResults {
  ssl?: { valid: boolean; issuer?: string; expiresAt?: string; daysUntilExpiry?: number; error?: string };
  dns?: { resolved: boolean; records?: string[]; error?: string };
  seo?: { hasTitle: boolean; titleLength: number; hasMetaDescription: boolean; metaDescriptionLength: number; hasCanonical: boolean; hasOgTags: boolean; hasRobotsTxt: boolean; issues: string[] };
  viewport?: { hasViewportMeta: boolean; content?: string; issues: string[] };
  performance?: { loadTimeMs?: number; totalSizeBytes?: number; resourceCount?: number; issues: string[] };
  _forms?: { formCount: number; formsWithAction: number; deadEndpoints: string[]; issues: string[] };
}

interface ReportData {
  token: string;
  url: string;
  score: number;
  summary: string;
  results: ScanResults;
  created_at: string;
}

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/report?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Report not found');
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
          <h1 className="mt-4 text-xl font-semibold text-white">Report Not Found</h1>
          <p className="mt-2 text-sm text-zinc-500">{error || 'This report does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-3xl"
      >
        <Card className="border-zinc-800">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Website Audit Report</h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <ExternalLink className="h-4 w-4" />
                  <a href={report.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                    {report.url}
                  </a>
                </div>
              </div>
              <Badge variant={report.score >= 70 ? 'success' : report.score >= 40 ? 'warning' : 'danger'}>
                Score: {report.score}/100
              </Badge>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              Generated {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full ${report.score >= 70 ? 'bg-emerald-500' : report.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${report.score}%` }}
              />
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-zinc-100">Summary</h2>
              <p className="mt-2 text-sm text-zinc-400">{report.summary}</p>
            </div>

            {report.results && typeof report.results === 'object' && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-zinc-100">Detailed Findings</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {report.results?.ssl && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-sm font-medium text-zinc-200">SSL Certificate</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {report.results.ssl.valid ? (
                          <span className="text-emerald-400">Valid</span>
                        ) : (
                          <span className="text-red-400">Invalid or missing</span>
                        )}
                      </div>
                    </div>
                  )}

                  {report.results?.dns && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-sm font-medium text-zinc-200">DNS Resolution</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {report.results.dns.resolved ? (
                          <span className="text-emerald-400">Resolved</span>
                        ) : (
                          <span className="text-red-400">Failed</span>
                        )}
                      </div>
                    </div>
                  )}

                  {report.results?.seo && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-sm font-medium text-zinc-200">SEO Meta Tags</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        Title: {report.results.seo.hasTitle ? 'Yes' : 'No'} | 
                        Description: {report.results.seo.hasMetaDescription ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}

                  {report.results?.viewport && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-sm font-medium text-zinc-200">Mobile Viewport</div>
                      <div className="mt-1 text-xs text-zinc-400">
                        {report.results.viewport.hasViewportMeta ? (
                          <span className="text-emerald-400">Configured</span>
                        ) : (
                          <span className="text-red-400">Missing</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-zinc-800 pt-6 text-center">
              <p className="text-xs text-zinc-600">
                Report generated by <span className="text-emerald-400">Livecheck</span> - the last-mile deployment rescue layer for AI-built websites.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
