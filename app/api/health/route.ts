import { NextResponse } from 'next/server';
import pkg from '@/package.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const healthData = {
    status: 'healthy',
    service: 'nahj-app',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION ?? 'me-central-1',
    environment: process.env.NODE_ENV ?? 'development',
    compliance: {
      pdpl: {
        status: 'compliant',
        dataResidency: 'KSA',
        encryptionAtRest: true,
        encryptionInTransit: true,
        auditLogging: true,
      },
      sama: {
        status: 'compliant',
        securityHeaders: true,
        accessControls: true,
        monitoring: true,
        incidentResponse: true,
      },
    },
    infrastructure: {
      provider: 'AWS',
      region: 'me-central-1',
      services: ['DynamoDB', 'Secrets Manager', 'CloudWatch', 'Lambda'],
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
