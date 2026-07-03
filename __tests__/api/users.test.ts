const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
  GetCommand: jest.fn().mockImplementation((input) => ({ input })),
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  ScanCommand: jest.fn().mockImplementation((input) => ({ input })),
  UpdateCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

// Mock NextAuth — getServerSession returns an authenticated session by default
const mockGetServerSession = jest.fn();
jest.mock('next-auth', () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';
import { _store } from '@/lib/ratelimit';

function makeRequest(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost/api/users');
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validUser = {
  name: 'محمد علي',
  email: 'test@example.com',
  password: 'Password1',
  consent: true,
};

// Reset all shared state between tests
beforeEach(() => {
  mockSend.mockReset();
  mockGetServerSession.mockReset();
  _store.clear();
});

describe('POST /api/users', () => {
  it('creates a user and returns 201 without nationalId or passwordHash', async () => {
    // getUserByEmail → not found; createUser → ok; audit → ok
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 }); // getUserByEmail
    mockSend.mockResolvedValueOnce({});                       // createUser
    mockSend.mockResolvedValueOnce({});                       // audit log

    const req = makeRequest('POST', validUser);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data).not.toHaveProperty('nationalId');
    expect(body.data).not.toHaveProperty('passwordHash');
    expect(body.data.email).toBe('test@example.com');
  });

  it('returns 409 for duplicate email', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [{ userId: 'existing', email: 'test@example.com' }],
      Count: 1,
    });

    const req = makeRequest('POST', validUser);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('مسجل مسبقاً');
  });

  it('returns 400 for invalid email', async () => {
    const req = makeRequest('POST', { ...validUser, email: 'not-email' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing name', async () => {
    const req = makeRequest('POST', { ...validUser, name: undefined });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const req = makeRequest('POST', { ...validUser, password: 'weak' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/users', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const req = makeRequest('GET');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns a list of users without nationalId or passwordHash', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: { id: 'user-1', email: 'user@example.com' } });
    mockSend.mockResolvedValueOnce({
      Items: [
        { userId: 'u1', name: 'علي', email: 'ali@example.com', nationalId: '1234567890', passwordHash: 'hash' },
      ],
      Count: 1,
    });
    mockSend.mockResolvedValueOnce({}); // audit

    const req = makeRequest('GET');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0]).not.toHaveProperty('nationalId');
    expect(body.data[0]).not.toHaveProperty('passwordHash');
  });
});
