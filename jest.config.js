/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['lib/**/*.ts', 'app/api/**/*.ts', '!**/*.d.ts'],
  coverageReporters: ['text', 'lcov'],
};
