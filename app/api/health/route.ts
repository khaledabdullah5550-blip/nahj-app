import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || 'me-central-1',
      version: process.env.npm_package_version || '1.0.0',
      compliance: {
        pdpl: true,
        sama: true,
        dataResidency: 'Saudi Arabia (Riyadh Region)',
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
