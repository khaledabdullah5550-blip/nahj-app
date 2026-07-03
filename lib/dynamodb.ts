import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import { dynamodbClient } from './aws'

const docClient = DynamoDBDocumentClient.from(dynamodbClient)

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'nahj-users'
const TRANSACTIONS_TABLE = process.env.DYNAMODB_TRANSACTIONS_TABLE || 'nahj-transactions'

export interface User {
  userId: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  transactionId: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  createdAt: string
}

export async function createUser(data: Omit<User, 'userId' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const now = new Date().toISOString()
  const user: User = {
    userId: uuidv4(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)',
    })
  )

  return user
}

export async function getUser(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  )

  return (result.Item as User) || null
}

export async function listUsers(limit = 20): Promise<User[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      Limit: limit,
    })
  )

  return (result.Items as User[]) || []
}

export async function createTransaction(
  data: Omit<Transaction, 'transactionId' | 'createdAt'>
): Promise<Transaction> {
  const transaction: Transaction = {
    transactionId: uuidv4(),
    ...data,
    createdAt: new Date().toISOString(),
  }

  await docClient.send(
    new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: transaction,
    })
  )

  return transaction
}

export async function listTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      Limit: limit,
      ScanIndexForward: false,
    })
  )

  return (result.Items as Transaction[]) || []
}
