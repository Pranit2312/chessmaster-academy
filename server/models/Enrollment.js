const mongoose = require('mongoose');

// ============================================
// ENROLLMENT SCHEMA
// ============================================
const enrollmentSchema = new mongoose.Schema({
  // Relationships
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student must be specified']
  },
  
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course must be specified']
  },
  
  // Enrollment Details
  enrollmentStatus: {
    type: String,
    enum: ['pending', 'active', 'completed', 'dropped', 'suspended'],
    default: 'pending'
  },
  
  enrollmentMethod: {
    type: String,
    enum: ['purchase', 'free', 'promo', 'admin'],
    required: true
  },
  
  // Financial Information
  pricePaid: {
    type: Number,
    required: true,
    default: 0
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  discountPercentage: {
    type: Number,
    default: 0
  },
  
  actualPrice: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Payment Reference
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Progress Tracking
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  lessonsCompleted: {
    type: Number,
    default: 0
  },
  
  lessonsStarted: {
    type: Number,
    default: 0
  },
  
  totalLessons: {
    type: Number,
    required: true
  },
  
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  
  lastAccessedAt: Date,
  
  lastAccessedLessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  
  // Performance Tracking
  performanceMetrics: {
    totalWatchTime: {
      type: Number,
      default: 0 // in minutes
    },
    averageQuizScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    quizzesAttempted: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  },
  
  // Lesson-wise Progress
  lessonProgress: [
    {
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
      },
      watchedDuration: {
        type: Number,
        default: 0 // in seconds
      },
      quizScore: {
        type: Number,
        min: 0,
        max: 100
      },
      quizAttempts: {
        type: Number,
        default: 0
      },
      lastViewedAt: Date,
      completedAt: Date
    }
  ],
  
  // Certificate Information
  certificateEarned: {
    type: Boolean,
    default: false
  },
  
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  
  certificateIssuedAt: Date,
  
  // Interaction Data
  questionsAsked: {
    type: Number,
    default: 0
  },
  
  discussionReplies: {
    type: Number,
    default: 0
  },
  
  resources: [
    {
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      resourceId: String,
      downloadedAt: Date
    }
  ],
  
  // Notes/Bookmarks
  bookmarkedLessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  ],
  
  notes: [
    {
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      content: String,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  
  // Refund Information
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'processed'],
    default: 'none'
  },
  
  refundAmount: Number,
  
  refundReason: String,
  
  refundRequestedAt: Date,
  
  refundProcessedAt: Date,
  
  // Engagement
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: Date,
  
  droppedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for unique enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ enrollmentStatus: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ progressPercentage: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
