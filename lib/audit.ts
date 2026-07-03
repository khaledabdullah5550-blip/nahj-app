import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getDocumentClient, TABLE_NAMES, AWS_REGION } from './aws';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_READ'
  | 'USERS_LISTED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_READ'
  | 'TRANSACTIONS_LISTED'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'DATA_EXPORT'
  | 'DATA_DELETE_REQUEST'
  | 'CONSENT_GIVEN'
  | 'CONSENT_REVOKED';

export interface AuditLogEntry {
  logId: string;
  timestamp: string;
  action: AuditAction;
  userId?: string;
  performedBy?: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  dataResidency: 'KSA';
  region: string;
  // PDPL required fields
  pdplCategory?: 'personal_data' | 'sensitive_data' | 'financial_data';
  retentionDays: number;
}

// TTL: 2 years for financial audit logs (SAMA requirement)
const AUDIT_RETENTION_DAYS = 730;
const FINANCIAL_AUDIT_RETENTION_DAYS = 2555; // 7 years for financial records

/**
 * Log an audit event to DynamoDB.
 * All operations must be logged per PDPL and SAMA requirements.
 */
export async function logAuditEvent(
  action: AuditAction,
  params: {
    userId?: string;
    performedBy?: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    pdplCategory?: AuditLogEntry['pdplCategory'];
  }
): Promise<void> {
  const isFinancial =
    params.resourceType === 'Transaction' ||
    action.startsWith('TRANSACTION_') ||
    action === 'DATA_EXPORT';

  const retentionDays = isFinancial ? FINANCIAL_AUDIT_RETENTION_DAYS : AUDIT_RETENTION_DAYS;
  const now = new Date();
  const logId = uuidv4();

  const entry: AuditLogEntry = {
    logId,
    timestamp: now.toISOString(),
    action,
    userId: params.userId,
    performedBy: params.performedBy,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    errorMessage: params.errorMessage,
    metadata: params.metadata,
    dataResidency: 'KSA',
    region: AWS_REGION,
    pdplCategory: params.pdplCategory || 'personal_data',
    retentionDays,
  };

  try {
    const client = getDocumentClient();
    await client.send(
      new PutCommand({
        TableName: TABLE_NAMES.AUDIT_LOGS,
        Item: {
          ...entry,
          // TTL attribute for DynamoDB auto-deletion after retention period
          ttl: Math.floor(now.getTime() / 1000) + retentionDays * 24 * 60 * 60,
        },
      })
    );
  } catch (error) {
    // Audit logging failure should be logged to stderr but not fail the request
    console.error('⚠️  فشل تسجيل حدث المراجعة:', { action, error });
  }
}

/**
 * Extract client IP from request headers (supports Vercel/CloudFront).
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
