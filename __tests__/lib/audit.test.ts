// Mock DynamoDB before importing audit module
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';

const FINANCIAL_RETENTION = 2555;
const PERSONAL_RETENTION = 730;

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

describe('logAuditEvent', () => {
  it('logs a personal data event with correct TTL', async () => {
    await logAuditEvent('USER_CREATED', {
      userId: 'user-1',
      resourceType: 'User',
      success: true,
      pdplCategory: 'personal_data',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.Item.action).toBe('USER_CREATED');
    expect(call.input.Item.retentionDays).toBe(PERSONAL_RETENTION);
    expect(call.input.Item.dataResidency).toBe('KSA');
  });

  it('logs a financial event with SAMA 7-year TTL', async () => {
    await logAuditEvent('TRANSACTION_CREATED', {
      userId: 'user-1',
      resourceType: 'Transaction',
      success: true,
      pdplCategory: 'financial_data',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.input.Item.retentionDays).toBe(FINANCIAL_RETENTION);
  });

  it('sets correct TTL unix timestamp', async () => {
    const before = Math.floor(Date.now() / 1000);
    await logAuditEvent('USER_READ', {
      resourceType: 'User',
      success: true,
    });
    const after = Math.floor(Date.now() / 1000);

    const call = mockSend.mock.calls[0][0];
    const ttl: number = call.input.Item.ttl;
    const expectedMin = before + PERSONAL_RETENTION * 24 * 60 * 60;
    const expectedMax = after + PERSONAL_RETENTION * 24 * 60 * 60;
    expect(ttl).toBeGreaterThanOrEqual(expectedMin);
    expect(ttl).toBeLessThanOrEqual(expectedMax);
  });

  it('generates unique logId for every event', async () => {
    await logAuditEvent('USER_READ', { resourceType: 'User', success: true });
    await logAuditEvent('USER_READ', { resourceType: 'User', success: true });

    const id1 = mockSend.mock.calls[0][0].input.Item.logId;
    const id2 = mockSend.mock.calls[1][0].input.Item.logId;
    expect(id1).not.toBe(id2);
  });

  it('records ISO 8601 timestamp', async () => {
    await logAuditEvent('USER_READ', { resourceType: 'User', success: true });
    const ts: string = mockSend.mock.calls[0][0].input.Item.timestamp;
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('does not throw when DynamoDB call fails (swallows error)', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'));
    await expect(
      logAuditEvent('USER_READ', { resourceType: 'User', success: false })
    ).resolves.toBeUndefined();
  });
});

describe('getClientIP', () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request('http://localhost/api/test', { headers });
  }

  it('prefers x-forwarded-for (first IP only)', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = makeRequest({ 'x-real-ip': '9.10.11.12' });
    expect(getClientIP(req)).toBe('9.10.11.12');
  });

  it('returns "unknown" when no IP headers present', () => {
    const req = makeRequest({});
    expect(getClientIP(req)).toBe('unknown');
  });
});

describe('getUserAgent', () => {
  it('returns the user-agent header', () => {
    const req = new Request('http://localhost/', {
      headers: { 'user-agent': 'TestBot/1.0' },
    });
    expect(getUserAgent(req)).toBe('TestBot/1.0');
  });

  it('returns "unknown" when absent', () => {
    const req = new Request('http://localhost/');
    expect(getUserAgent(req)).toBe('unknown');
  });
});
