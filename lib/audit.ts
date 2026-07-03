import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBDocClient } from './aws';
import { randomUUID } from 'crypto';

const AUDIT_TABLE = process.env.DYNAMODB_AUDIT_TABLE ?? 'nahj-audit-logs';

export interface AuditEvent {
  eventId: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type LogAuditEventInput = Omit<AuditEvent, 'eventId' | 'timestamp'>;

export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  const event: AuditEvent = {
    eventId: randomUUID(),
    ...input,
    timestamp: new Date().toISOString(),
  };

  try {
    await dynamoDBDocClient.send(
      new PutCommand({
        TableName: AUDIT_TABLE,
        Item: event,
      })
    );
  } catch (error) {
    // Audit logging must not break the main flow; log to console as fallback.
    console.error('[audit] Failed to write audit log:', error, event);
  }
}
