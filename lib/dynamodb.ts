import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDocumentClient, TABLE_NAMES } from './aws';

// ============================================================
// Interfaces / Types
// ============================================================

export interface User {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  nationalId?: string;
  /** bcrypt hash of the user's password — never returned in API responses */
  passwordHash?: string;
  status: 'active' | 'inactive' | 'suspended';
  consentGiven: boolean;
  consentTimestamp: string;
  createdAt: string;
  updatedAt: string;
  dataResidency: 'KSA';
}

export interface Transaction {
  transactionId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  category: string;
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
  updatedAt: string;
  dataResidency: 'KSA';
}

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

// ============================================================
// Users
// ============================================================

export async function getUserById(userId: string): Promise<User | null> {
  const client = getDocumentClient();

  const result = await client.send(
    new GetCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
    })
  );

  return (result.Item as User) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = getDocumentClient();

  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAMES.USERS,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as User) || null;
}

export async function createUser(user: User): Promise<User> {
  const client = getDocumentClient();

  await client.send(
    new PutCommand({
      TableName: TABLE_NAMES.USERS,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  );

  return user;
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'userId' | 'createdAt' | 'dataResidency'>>
): Promise<User | null> {
  const client = getDocumentClient();
  const timestamp = new Date().toISOString();

  const updateFields = { ...updates, updatedAt: timestamp };
  const updateExpression = Object.keys(updateFields)
    .map((key, i) => `#field${i} = :val${i}`)
    .join(', ');
  const expressionAttributeNames = Object.fromEntries(
    Object.keys(updateFields).map((key, i) => [`#field${i}`, key])
  );
  const expressionAttributeValues = Object.fromEntries(
    Object.values(updateFields).map((val, i) => [`:val${i}`, val])
  );

  const result = await client.send(
    new UpdateCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(userId)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return (result.Attributes as User) || null;
}

export async function listUsers(
  limit = 20,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedResult<User>> {
  const client = getDocumentClient();

  const result = await client.send(
    new ScanCommand({
      TableName: TABLE_NAMES.USERS,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
      FilterExpression: '#status <> :deleted',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':deleted': 'deleted' },
    })
  );

  return {
    items: (result.Items as User[]) || [],
    count: result.Count || 0,
    lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

// ============================================================
// Transactions
// ============================================================

export async function getTransactionById(transactionId: string, userId: string): Promise<Transaction | null> {
  const client = getDocumentClient();

  const result = await client.send(
    new GetCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      Key: { transactionId, userId },
    })
  );

  return (result.Item as Transaction) || null;
}

export async function createTransaction(transaction: Transaction): Promise<Transaction> {
  const client = getDocumentClient();

  await client.send(
    new PutCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      Item: transaction,
      ConditionExpression: 'attribute_not_exists(transactionId)',
    })
  );

  return transaction;
}

export async function listTransactionsByUser(
  userId: string,
  limit = 20,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedResult<Transaction>> {
  const client = getDocumentClient();

  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAMES.TRANSACTIONS,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (result.Items as Transaction[]) || [],
    count: result.Count || 0,
    lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const client = getDocumentClient();

  // PDPL: Soft delete to maintain audit trail
  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAMES.USERS,
      Key: { userId },
      UpdateExpression: 'SET #status = :deleted, updatedAt = :ts, deletedAt = :ts',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':deleted': 'deleted',
        ':ts': new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(userId)',
    })
  );
}
