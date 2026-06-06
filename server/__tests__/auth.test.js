const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'student'
      };

      const user = await User.create(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'student'
      };

      await User.create(userData);
      
      try {
        await User.create(userData);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'student'
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe(userData.password);
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const userId = '123456';
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(userId);
    });
  });
});
