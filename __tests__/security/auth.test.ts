const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

// Mock NextAuth credentials authorize
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

import { POST as usersPost } from '@/app/api/users/route';
import { GET as transactionsGet } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';
import { _store } from '@/lib/ratelimit';

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Reset all mocks before every test to prevent queue contamination
beforeEach(() => {
  mockSend.mockReset();
  mockGetServerSession.mockReset();
  _store.clear();
});

describe('Authentication — POST /api/users (registration is public)', () => {
  it('allows registration without a session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    mockSend.mockResolvedValueOnce({});
    mockSend.mockResolvedValueOnce({});

    const req = makeRequest('POST', 'http://localhost/api/users', {
      name: 'مستخدم جديد',
      email: 'new@example.com',
      password: 'Password1',
      consent: true,
    });
    const res = await usersPost(req);
    expect(res.status).toBe(201);
  });
});

describe('Authentication — GET /api/transactions', () => {
  it('returns 401 with no token', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = makeRequest('GET', 'http://localhost/api/transactions');
    const res = await transactionsGet(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('غير مصرَّح');
  });

  it('returns 401 with an empty/invalid session', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: {} });
    const req = makeRequest('GET', 'http://localhost/api/transactions');
    const res = await transactionsGet(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 with a valid session', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'u1', email: 'u@example.com' } });
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    mockSend.mockResolvedValueOnce({});

    const req = makeRequest('GET', 'http://localhost/api/transactions');
    const res = await transactionsGet(req);
    expect(res.status).toBe(200);
  });
});
