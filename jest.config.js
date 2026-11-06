/**
 * Jest configuration for BypassNote
 * Uses jest-expo preset for Expo + React Native compatibility.
 */

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testMatch: ['**/*.test.{ts,tsx,js}', '**/__tests__/**/*.test.{ts,tsx,js}'],

  // Coverage collection scope: src/ and bpnote_modules/ (test files excluded)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js}',
    'bpnote_modules/**/*.{ts,tsx,js}',
    '!**/*.test.{ts,tsx,js}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],

  // Seuils de couverture : ligne de base actuelle, à relever progressivement.
  // Objectif long terme : 70 % (voir README-COVERAGE.md).
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 40,
      lines: 50,
      statements: 48,
    },
  },

  // Reporters
  reporters: ['default'],

  // Exclude non-source files from coverage and test discovery
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
  ],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Module name mapping for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
