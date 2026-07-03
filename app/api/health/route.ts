import { NextResponse } from 'next/server';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { getDynamoDBClient, TABLE_NAMES } from '@/lib/aws';

export async function GET() {
  let dbStatus: 'connected' | 'degraded' | 'unavailable' = 'unavailable';
  let dbError: string | undefined;

  try {
    const client = getDynamoDBClient();
    const result = await client.send(
      new DescribeTableCommand({ TableName: TABLE_NAMES.USERS })
    );
    if (result.Table?.TableStatus === 'ACTIVE') {
      dbStatus = 'connected';
    } else {
      dbStatus = 'degraded';
    }
  } catch (error) {
    dbError = String(error);
    dbStatus = 'unavailable';
    console.error('فشل فحص قاعدة البيانات:', error);
  }

  const isHealthy = dbStatus === 'connected';

  const health = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    region: process.env.AWS_REGION || 'me-central-1',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      ...(dbError ? { databaseError: dbError } : {}),
    },
    compliance: {
      dataResidency: 'KSA (me-central-1)',
      pdpl: 'compliant',
      sama: 'compliant',
    },
  };

  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
