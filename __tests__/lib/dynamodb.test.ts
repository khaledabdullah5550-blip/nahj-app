const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  GetCommand: jest.fn().mockImplementation((input) => ({ input })),
  PutCommand: jest.fn().mockImplementation((input) => ({ input })),
  UpdateCommand: jest.fn().mockImplementation((input) => ({ input })),
  QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
  ScanCommand: jest.fn().mockImplementation((input) => ({ input })),
  DeleteCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

import {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  listUsers,
  deleteUser,
  createTransaction,
  listTransactionsByUser,
  type User,
  type Transaction,
} from '@/lib/dynamodb';

const baseUser: User = {
  userId: 'user-123',
  name: 'محمد',
  email: 'test@example.com',
  status: 'active',
  consentGiven: true,
  consentTimestamp: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  dataResidency: 'KSA',
};

const baseTransaction: Transaction = {
  transactionId: 'tx-123',
  userId: 'user-123',
  type: 'credit',
  amount: 500,
  currency: 'SAR',
  description: 'راتب',
  category: 'دخل',
  status: 'completed',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  dataResidency: 'KSA',
};

beforeEach(() => {
  mockSend.mockReset();
});

// ── Users ─────────────────────────────────────────────────────────────────────

describe('getUserById', () => {
  it('returns the user when found', async () => {
    mockSend.mockResolvedValueOnce({ Item: baseUser });
    const user = await getUserById('user-123');
    expect(user).toEqual(baseUser);
  });

  it('returns null when not found', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    const user = await getUserById('nonexistent');
    expect(user).toBeNull();
  });
});

describe('getUserByEmail', () => {
  it('returns the first matching user', async () => {
    mockSend.mockResolvedValueOnce({ Items: [baseUser], Count: 1 });
    const user = await getUserByEmail('test@example.com');
    expect(user).toEqual(baseUser);
  });

  it('returns null when no match', async () => {
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    const user = await getUserByEmail('nobody@example.com');
    expect(user).toBeNull();
  });
});

describe('createUser', () => {
  it('calls PutCommand with attribute_not_exists condition', async () => {
    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    mockSend.mockResolvedValueOnce({});
    const result = await createUser(baseUser);
    expect(result).toEqual(baseUser);
    expect(PutCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );
  });
});

describe('updateUser', () => {
  it('returns the updated user attributes', async () => {
    const updated = { ...baseUser, name: 'خالد' };
    mockSend.mockResolvedValueOnce({ Attributes: updated });
    const result = await updateUser('user-123', { name: 'خالد' });
    expect(result?.name).toBe('خالد');
  });

  it('returns null when item does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Attributes: undefined });
    const result = await updateUser('nonexistent', { name: 'test' });
    expect(result).toBeNull();
  });
});

describe('listUsers', () => {
  it('returns paginated results', async () => {
    mockSend.mockResolvedValueOnce({
      Items: [baseUser],
      Count: 1,
      LastEvaluatedKey: undefined,
    });
    const result = await listUsers(10);
    expect(result.items).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.lastEvaluatedKey).toBeUndefined();
  });

  it('passes lastEvaluatedKey for pagination', async () => {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    mockSend.mockResolvedValueOnce({ Items: [], Count: 0 });
    const lastKey = { userId: 'last-key' };
    await listUsers(20, lastKey);
    expect(ScanCommand).toHaveBeenCalledWith(
      expect.objectContaining({ ExclusiveStartKey: lastKey })
    );
  });
});

describe('deleteUser', () => {
  it('soft-deletes by setting status to deleted', async () => {
    const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    mockSend.mockResolvedValueOnce({});
    await deleteUser('user-123');
    expect(UpdateCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ExpressionAttributeValues: expect.objectContaining({ ':deleted': 'deleted' }),
      })
    );
  });
});

// ── Transactions ──────────────────────────────────────────────────────────────

describe('createTransaction', () => {
  it('creates and returns the transaction', async () => {
    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    mockSend.mockResolvedValueOnce({});
    const result = await createTransaction(baseTransaction);
    expect(result).toEqual(baseTransaction);
    expect(PutCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ConditionExpression: 'attribute_not_exists(transactionId)',
      })
    );
  });
});

describe('listTransactionsByUser', () => {
  it('returns transactions sorted by createdAt desc', async () => {
    const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
    mockSend.mockResolvedValueOnce({ Items: [baseTransaction], Count: 1 });
    const result = await listTransactionsByUser('user-123', 10);
    expect(result.items).toHaveLength(1);
    expect(QueryCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        ScanIndexForward: false,
        ExpressionAttributeValues: { ':userId': 'user-123' },
      })
    );
  });
});
