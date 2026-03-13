export default {
  testEnvironment: 'node',
  transform: {}, // No transformer needed for native ESM
  moduleNameMapper: {
    // This allows us to use .js extensions in our imports which ESM requires
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  forceExit: true, // Crucial for preventing the "teardown" hang with DB connections
  testTimeout: 15000
};