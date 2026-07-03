import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDBDocClient } from './aws';
import { randomUUID } from 'crypto';

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE ?? 'nahj-users';
const TRANSACTIONS_TABLE =
  process.env.DYNAMODB_TRANSACTIONS_TABLE ?? 'nahj-transactions';

// ─── User interfaces ────────────────────────────────────────────────────────

export interface User {
  userId: string;
  name: string;
  email: string;
  nationalId?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export type CreateUserInput = Pick<User, 'name' | 'email'> & {
  nationalId?: string;
};

// ─── Transaction interfaces ──────────────────────────────────────────────────

export interface Transaction {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTransactionInput = Pick<
  Transaction,
  'userId' | 'amount' | 'currency'
> & { description?: string };

// ─── User helpers ────────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<User | null> {
  const result = await dynamoDBDocClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  );
  return (result.Item as User) ?? null;
}

export async function listUsers(): Promise<{ users: User[]; count: number }> {
  const result = await dynamoDBDocClient.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      Limit: 100,
    })
  );
  const users = (result.Items ?? []) as User[];
  return { users, count: users.length };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const now = new Date().toISOString();
  const user: User = {
    userId: randomUUID(),
    name: input.name,
    email: input.email,
    ...(input.nationalId && { nationalId: input.nationalId }),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDBDocClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  );

  return user;
}

// ─── Transaction helpers ─────────────────────────────────────────────────────

export async function getTransactionById(
  transactionId: string
): Promise<Transaction | null> {
  const result = await dynamoDBDocClient.send(
    new GetCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: { transactionId },
    })
  );
  return (result.Item as Transaction) ?? null;
}

export async function listTransactions(userId?: string): Promise<{
  transactions: Transaction[];
  count: number;
}> {
  if (userId) {
    const result = await dynamoDBDocClient.send(
      new QueryCommand({
        TableName: TRANSACTIONS_TABLE,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false,
        Limit: 100,
      })
    );
    const transactions = (result.Items ?? []) as Transaction[];
    return { transactions, count: transactions.length };
  }

  const result = await dynamoDBDocClient.send(
    new ScanCommand({
      TableName: TRANSACTIONS_TABLE,
      Limit: 100,
    })
  );
  const transactions = (result.Items ?? []) as Transaction[];
  return { transactions, count: transactions.length };
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const now = new Date().toISOString();
  const transaction: Transaction = {
    transactionId: randomUUID(),
    userId: input.userId,
    amount: input.amount,
    currency: input.currency,
    status: 'pending',
    ...(input.description && { description: input.description }),
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDBDocClient.send(
    new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: transaction,
      ConditionExpression: 'attribute_not_exists(transactionId)',
    })
  );

  return transaction;
}
