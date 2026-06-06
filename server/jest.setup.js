// Jest setup file
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/chess-test';
process.env.RAZORPAY_KEY_ID = 'test-key';
process.env.RAZORPAY_KEY_SECRET = 'test-secret';

// Mock console to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};
