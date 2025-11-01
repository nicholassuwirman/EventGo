module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/?(*.)+(integration.test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // Longer timeout for integration tests
  // Only run integration tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '(?<!\\.integration)\\.test\\.ts$'
  ]
};