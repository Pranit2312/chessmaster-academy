const mongoose = require('mongoose');

// ============================================
// LESSON SCHEMA
// ============================================
const lessonSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Content Type
  contentType: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'mixed'],
    required: true
  },
  
  // Relationships
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: [true, 'Lesson must belong to a chapter']
  },
  
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Lesson must belong to a course']
  },
  
  // Sequencing
  orderIndex: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Video Content
  video: {
    publicId: String,
    url: String,
    duration: Number, // in seconds
    videoQuality: [
      {
        resolution: String, // '720p', '1080p', etc.
        url: String
      }
    ],
    thumbnail: String,
    uploadedAt: Date
  },
  
  // Additional Content
  content: {
    richText: String, // HTML content for lesson description
    codeSnippets: [
      {
        title: String,
        language: String,
        code: String
      }
    ]
  },
  
  // Resources
  resources: [
    {
      title: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['pdf', 'pgn', 'link', 'image'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      publicId: String,
      size: Number, // in bytes
      uploadedAt: Date
    }
  ],
  
  // Quiz/Assignment
  quiz: {
    questions: [
      {
        question: String,
        type: {
          type: String,
          enum: ['multipleChoice', 'trueFalse', 'shortAnswer']
        },
        options: [String],
        correctAnswer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LessonQuizAnswer'
        },
        explanation: String
      }
    ],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  },
  
  // Chess-Specific Fields
  chessBoardConfig: {
    puzzlePosition: String, // FEN notation
    initialMoves: [String], // List of moves to replay
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  },
  
  openingCoverage: [
    {
      openingName: String,
      ecoCodes: [String]
    }
  ],
  
  // Learning Objectives
  learningObjectives: [
    {
      type: String,
      maxlength: 200
    }
  ],
  
  // Metadata
  estimatedDuration: {
    type: Number,
    default: 0 // in minutes
  },
  
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  
  isPreview: {
    type: Boolean,
    default: false
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Engagement Metrics
  engagementMetrics: {
    views: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0 // in seconds
    },
    averageQuizScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    userRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
lessonSchema.index({ chapter: 1, orderIndex: 1 });
lessonSchema.index({ course: 1 });
lessonSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
