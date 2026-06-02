module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@proyecto/shared-core$': '<rootDir>/../../packages/shared-core/src',
    '^@proyecto/shared-core/(.*)$': '<rootDir>/../../packages/shared-core/src/$1',
  }
};
