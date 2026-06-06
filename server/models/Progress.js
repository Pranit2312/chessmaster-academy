const mongoose = require('mongoose');

// ============================================
// PROGRESS SCHEMA
// ============================================
const progressSchema = new mongoose.Schema({
  // Relationships
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  
  // Progress Status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  
  // Learning Metrics
  watchedDuration: {
    type: Number,
    default: 0 // in seconds
  },
  
  videoDuration: {
    type: Number,
    default: 0 // in seconds
  },
  
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Quiz Performance
  quizAttempts: [
    {
      attemptNumber: Number,
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      totalQuestions: Number,
      correctAnswers: Number,
      timeSpent: Number, // in seconds
      attemptedAt: Date,
      answers: [
        {
          questionId: String,
          selectedAnswer: String,
          isCorrect: Boolean
        }
      ]
    }
  ],
  
  bestQuizScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  lastQuizAttemptAt: Date,
  
  // Assignment Performance
  assignments: [
    {
      assignmentId: String,
      status: {
        type: String,
        enum: ['not_submitted', 'submitted', 'graded'],
        default: 'not_submitted'
      },
      submittedAt: Date,
      gradedAt: Date,
      score: Number,
      feedback: String
    }
  ],
  
  // Engagement
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  
  sessionCount: {
    type: Number,
    default: 0
  },
  
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  
  streakDays: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  startedAt: Date,
  
  completedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index
progressSchema.index({ student: 1, enrollment: 1 });
progressSchema.index({ course: 1, lesson: 1 });

module.exports = mongoose.model('Progress', progressSchema);
