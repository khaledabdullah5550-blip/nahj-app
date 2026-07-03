export interface AuditLog {
  timestamp: string
  action: string
  userId?: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAuditEvent(log: AuditLog): Promise<void> {
  const enrichedLog = {
    ...log,
    timestamp: log.timestamp || new Date().toISOString(),
    environment: process.env.NODE_ENV,
    region: process.env.AWS_REGION || 'me-central-1',
  }

  console.log(JSON.stringify({ type: 'AUDIT', ...enrichedLog }))
}
