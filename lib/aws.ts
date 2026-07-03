import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// AWS Region must be Riyadh for PDPL/SAMA compliance
const AWS_REGION = process.env.AWS_REGION || 'me-central-1';

if (process.env.NODE_ENV === 'production' && AWS_REGION !== 'me-central-1') {
  console.warn(
    `⚠️  تحذير: منطقة AWS هي "${AWS_REGION}" وليس "me-central-1" (الرياض). قد يكون هذا مخالفاً لنظام PDPL.`
  );
}

// DynamoDB client configuration
const clientConfig = {
  region: AWS_REGION,
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
    },
  }),
  ...(process.env.AWS_ACCESS_KEY_ID &&
    !process.env.DYNAMODB_ENDPOINT && {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    }),
};

// Singleton pattern for DynamoDB client
let dynamoDBClient: DynamoDBClient | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

export function getDynamoDBClient(): DynamoDBClient {
  if (!dynamoDBClient) {
    dynamoDBClient = new DynamoDBClient(clientConfig);
  }
  return dynamoDBClient;
}

export function getDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    documentClient = DynamoDBDocumentClient.from(getDynamoDBClient(), {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });
  }
  return documentClient;
}

// Table names
export const TABLE_NAMES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'nahj-users',
  TRANSACTIONS: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'nahj-transactions',
  AUDIT_LOGS: process.env.DYNAMODB_AUDIT_TABLE || 'nahj-audit-logs',
} as const;

export { AWS_REGION };
