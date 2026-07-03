const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  DescribeTableCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns 200 with required fields when DB is active', async () => {
    mockSend.mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } });
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('region');
    expect(body).toHaveProperty('version');
    expect(body.compliance).toHaveProperty('pdpl', 'compliant');
    expect(body.compliance).toHaveProperty('sama', 'compliant');
    expect(body.services.database).toBe('connected');
  });

  it('returns 503 when DB is unavailable', async () => {
    mockSend.mockRejectedValueOnce(new Error('Connection refused'));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe('degraded');
    expect(body.services.database).toBe('unavailable');
  });

  it('returns 503 when DB table status is not ACTIVE', async () => {
    mockSend.mockResolvedValueOnce({ Table: { TableStatus: 'CREATING' } });
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.services.database).toBe('degraded');
  });

  it('sets Cache-Control: no-store', async () => {
    mockSend.mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } });
    const response = await GET();
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('includes dataResidency KSA', async () => {
    mockSend.mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } });
    const response = await GET();
    const body = await response.json();
    expect(body.compliance.dataResidency).toContain('KSA');
  });
});
