import tls from 'node:tls';
import type { Check, CheckContext, CheckResult } from '../core/types';

interface CertificateInfo {
  authorized: boolean;
  authorizationError?: string | Error;
  validTo?: string;
}

function inspectCertificate(host: string, timeoutMs: number): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        resolve({
          authorized: socket.authorized,
          authorizationError: socket.authorizationError || undefined,
          validTo: typeof cert === 'object' && cert !== null ? cert.valid_to : undefined,
        });
      }
    );
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      reject(new Error('TLS handshake timed out'));
    });
    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

export const sslCheck: Check = {
  id: 'ssl',
  title: 'SSL / TLS',
  group: 'ssl',
  requiresBrowser: false,
  async run(ctx: CheckContext): Promise<CheckResult[]> {
    if (ctx.url.protocol === 'http:') {
      return [
        {
          id: 'ssl-https',
          title: 'HTTPS in use',
          group: 'ssl',
          status: 'fail',
          weight: 2,
          detail: 'The site URL uses plain HTTP — browsers flag it as "Not secure"',
        },
      ];
    }

    let cert: CertificateInfo;
    try {
      cert = await inspectCertificate(ctx.url.hostname, Math.min(ctx.timeoutMs, 10000));
    } catch (error) {
      return [
        {
          id: 'ssl-handshake',
          title: 'TLS connection',
          group: 'ssl',
          status: 'fail',
          weight: 2,
          detail: `Could not establish a secure connection: ${message(error)}`,
        },
      ];
    }

    const results: CheckResult[] = [
      {
        id: 'ssl-trusted',
        title: 'Certificate trusted',
        group: 'ssl',
        status: cert.authorized ? 'pass' : 'fail',
        weight: 2,
        detail: cert.authorized
          ? 'Chain validates against public trust stores'
          : `Validation failed: ${cert.authorizationError ?? 'unknown error'}`,
      },
    ];

    if (!cert.validTo) {
      results.push({
        id: 'ssl-expiry',
        title: 'Certificate expiry',
        group: 'ssl',
        status: 'warn',
        detail: 'Expiry date unavailable from the presented certificate',
      });
      return results;
    }

    const daysLeft = Math.floor(
      (new Date(cert.validTo).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    results.push({
      id: 'ssl-expiry',
      title: 'Certificate expiry',
      group: 'ssl',
      status: daysLeft < 0 ? 'fail' : daysLeft < 14 ? 'warn' : 'pass',
      weight: 2,
      detail:
        daysLeft < 0
          ? `Expired ${Math.abs(daysLeft)} days ago`
          : daysLeft < 14
            ? `Expires in ${daysLeft} days`
            : `Expires in ${daysLeft} days`,
    });
    return results;
  },
};

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
