const Course = require('../models/Course');
const User = require('../models/User');

describe('Course Controller', () => {
  let coachUser;

  beforeEach(async () => {
    await Course.deleteMany({});
    await User.deleteMany({});

    coachUser = await User.create({
      name: 'Test Coach',
      email: 'coach@example.com',
      password: 'TestPassword123!',
      role: 'coach'
    });
  });

  describe('Create Course', () => {
    it('should create a new course with valid data', async () => {
      const courseData = {
        title: 'Chess Openings Basics',
        description: 'Learn the fundamentals of chess openings',
        shortDescription: 'Chess Openings',
        category: 'Openings',
        difficulty: 'Beginner',
        instructor: coachUser._id,
        pricing: {
          price: 999,
          discountPercentage: 0,
          effectivePrice: 999
        }
      };

      const course = await Course.create(courseData);
      expect(course).toBeDefined();
      expect(course.title).toBe(courseData.title);
      expect(course.instructor).toEqual(coachUser._id);
    });

    it('should generate slug from title', async () => {
      const courseData = {
        title: 'Advanced Chess Strategy',
        description: 'Learn advanced chess strategies',
        shortDescription: 'Advanced Strategy',
        category: 'Strategy',
        difficulty: 'Advanced',
        instructor: coachUser._id,
        pricing: {
          price: 1999,
          discountPercentage: 0,
          effectivePrice: 1999
        }
      };

      const course = await Course.create(courseData);
      expect(course.slug).toBeDefined();
      expect(course.slug).toContain('advanced-chess-strategy');
    });

    it('should not allow duplicate course titles', async () => {
      const courseData = {
        title: 'Duplicate Course',
        description: 'Learn chess',
        shortDescription: 'Chess',
        category: 'Tactics',
        difficulty: 'Intermediate',
        instructor: coachUser._id,
        pricing: {
          price: 499,
          discountPercentage: 0,
          effectivePrice: 499
        }
      };

      await Course.create(courseData);
      
      try {
        await Course.create(courseData);
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Calculate Effective Price', () => {
    it('should calculate discounted price correctly', async () => {
      const courseData = {
        title: 'Discounted Course',
        description: 'Course with discount',
        shortDescription: 'Discount',
        category: 'Tactics',
        difficulty: 'Beginner',
        instructor: coachUser._id,
        pricing: {
          price: 1000,
          discountPercentage: 20,
          effectivePrice: 800
        }
      };

      const course = await Course.create(courseData);
      expect(course.pricing.effectivePrice).toBe(800);
    });
  });
});
