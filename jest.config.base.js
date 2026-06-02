/**
 * Jest Base Configuration
 * 
 * This is the base Jest configuration that all services should extend.
 * It provides standard settings for TypeScript testing in a Node.js environment.
 * 
 * Usage in service:
 * ```javascript
 * const baseConfig = require('../../jest.config.base');
 * module.exports = {
 *   ...baseConfig,
 *   displayName: 'my-service',
 *   // service-specific overrides
 * };
 * ```
 */

module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',

  // Node environment
  testEnvironment: 'node',

  // Root directories for test discovery
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform settings
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: {
          ignoreCodes: [151001], // Ignore experimental decorator warnings
        },
      },
    ],
  },

  // Module path mapping (for monorepo imports)
  moduleNameMapper: {
    '^@proyecto/shared-core$': '<rootDir>/../../packages/shared-core/dist',
    '^@proyecto/shared-core/(.*)$': '<rootDir>/../../packages/shared-core/dist/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Performance settings
  maxWorkers: '50%',
  testTimeout: 30000, // 30 seconds
  verbose: true,

  // Error handling
  bail: 0, // Don't stop on first failure
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect open handles that prevent Jest from exiting

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/reports',
        outputName: 'junit.xml',
      },
    ],
  ],
};
