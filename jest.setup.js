/**
 * Jest setup: Mock Expo native modules for running tests without a device/emulator.
 *
 * Individual test files handle their own module mocking via jest.mock().
 * This file configures global behavior shared across all tests.
 */

// Silence console.error/warn from React Native during tests
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('ReactNative'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('ReactNative'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
