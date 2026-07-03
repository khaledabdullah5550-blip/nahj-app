const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  ScanCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { GET, POST } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';
import { _store } from '@/lib/ratelimit';

const SESSION_USER_ID = 'user-abc';

function makeRequest(method: string, body?: unknown, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/transactions');
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validTransaction = {
  type: 'credit',
  amount: 1500,
  description: 'راتب شهري',
  category: 'دخل',
};

// Reset all mocks and rate-limit state between every test
beforeEach(() => {
  mockSend.mockReset();
  mockGetServerSession.mockReset();
  _store.clear();
});

describe('POST /api/transactions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = makeRequest('POST', validTransaction);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates a transaction and returns 201', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    mockSend.mockResolvedValueOnce({});  // createTransaction
    mockSend.mockResolvedValueOnce({});  // audit log

    const req = makeRequest('POST', validTransaction);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.userId).toBe(SESSION_USER_ID);
    expect(body.data.type).toBe('credit');
  });

  it('uses session userId — ignores body userId', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    mockSend.mockResolvedValueOnce({});
    mockSend.mockResolvedValueOnce({});

    const req = makeRequest('POST', { ...validTransaction, userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.userId).toBe(SESSION_USER_ID);
  });

  it('returns 400 for invalid type', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    const req = makeRequest('POST', { ...validTransaction, type: 'transfer' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for amount ≤ 0', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    const req = makeRequest('POST', { ...validTransaction, amount: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative amount', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    const req = makeRequest('POST', { ...validTransaction, amount: -100 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/transactions', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = makeRequest('GET');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns transactions for the authenticated user', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    mockSend.mockResolvedValueOnce({});

    const req = makeRequest('GET');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('returns 403 when userId param belongs to another user', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    const req = makeRequest('GET', undefined, { userId: 'other-user-id' });
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('مستخدم آخر');
  });

  it('accepts userId param when it matches the session userId', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: SESSION_USER_ID, email: 'u@example.com' },
    });
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    mockSend.mockResolvedValueOnce({});

    const req = makeRequest('GET', undefined, { userId: SESSION_USER_ID });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
