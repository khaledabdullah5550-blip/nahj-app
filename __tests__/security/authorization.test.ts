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
  ScanCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

import { GET as transactionsGet, POST as transactionsPost } from '@/app/api/transactions/route';
import { GET as usersGet } from '@/app/api/users/route';
import { _store } from '@/lib/ratelimit';
import { NextRequest } from 'next/server';

function makeGet(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' });
}

function makePost(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Reset all shared state before every test to prevent queue contamination
beforeEach(() => {
  mockSend.mockReset();
  mockGetServerSession.mockReset();
  _store.clear();
});

describe('Authorization — transactions belong to the session user', () => {
  it('returns 403 when a user tries to read another user\'s transactions via userId param', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'user-A', email: 'a@example.com' } });

    const req = makeGet('http://localhost/api/transactions?userId=user-B');
    const res = await transactionsGet(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('مستخدم آخر');
  });

  it('returns only own transactions when no userId param', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'user-A', email: 'a@example.com' } });
    mockSend.mockResolvedValueOnce({ Items: [{ transactionId: 'tx1', userId: 'user-A' }], Count: 1 });
    mockSend.mockResolvedValueOnce({});

    const req = makeGet('http://localhost/api/transactions');
    const res = await transactionsGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // All returned transactions must belong to the authenticated user
    body.data.forEach((tx: { userId: string }) => {
      expect(tx.userId).toBe('user-A');
    });
  });

  it('uses session userId in POST — ignores attacker-supplied userId in body', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'legitimate-user', email: 'l@example.com' } });
    mockSend.mockResolvedValueOnce({});
    mockSend.mockResolvedValueOnce({});

    const req = makePost('http://localhost/api/transactions', {
      type: 'credit',
      amount: 100,
      description: 'test',
      category: 'test',
      userId: 'attacker-user',
    });
    const res = await transactionsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.userId).toBe('legitimate-user');
    expect(body.data.userId).not.toBe('attacker-user');
  });
});

describe('Authorization — users list requires authentication', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = makeGet('http://localhost/api/users');
    const res = await usersGet(req);
    expect(res.status).toBe(401);
  });

  it('strips nationalId and passwordHash from user list', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'admin', email: 'admin@example.com' } });
    mockSend.mockResolvedValueOnce({
      Items: [
        {
          userId: 'u1',
          name: 'علي',
          email: 'ali@example.com',
          nationalId: '1234567890',
          passwordHash: 'secret-hash',
          status: 'active',
        },
      ],
      Count: 1,
    });
    mockSend.mockResolvedValueOnce({});

    const req = makeGet('http://localhost/api/users');
    const res = await usersGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0]).not.toHaveProperty('nationalId');
    expect(body.data[0]).not.toHaveProperty('passwordHash');
  });
});

describe('Rate Limiting', () => {
  it('returns 429 after exceeding listTransactions limit', async () => {
    // Set session for all requests
    mockGetServerSession.mockResolvedValue({ user: { id: 'rl-user', email: 'rl@example.com' } });
    // Make requests to exceed the 30/min limit
    mockSend.mockResolvedValue({ Items: [], Count: 0 });

    let lastStatus = 200;
    for (let i = 0; i < 35; i++) {
      const req = makeGet('http://localhost/api/transactions');
      const res = await transactionsGet(req);
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it('429 response includes Retry-After header', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'rl-user2', email: 'rl2@example.com' } });
    // Exhaust the listTransactions limit (30/min)
    for (let i = 0; i < 30; i++) {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
      mockSend.mockResolvedValueOnce({});
      const req = makeGet('http://localhost/api/transactions');
      await transactionsGet(req);
    }
    const req = makeGet('http://localhost/api/transactions');
    const res = await transactionsGet(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });
});
