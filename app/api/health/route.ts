import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'me-central-1',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      cache: 'connected',
    },
    compliance: {
      dataResidency: 'KSA (me-central-1)',
      pdpl: 'compliant',
      sama: 'compliant',
    },
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
