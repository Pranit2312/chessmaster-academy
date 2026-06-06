const mongoose = require('mongoose');

// ============================================
// CHAPTER SCHEMA
// ============================================
const chapterSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Relationship
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Chapter must belong to a course']
  },
  
  // Sequencing
  orderIndex: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Content
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  ],
  
  totalLessons: {
    type: Number,
    default: 0
  },
  
  // Duration tracking
  totalDuration: {
    type: Number,
    default: 0 // in minutes
  },
  
  // Metadata
  isVisible: {
    type: Boolean,
    default: true
  },
  
  requiredChapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    }
  ],
  
  // Optional chapter-level resources
  resources: [
    {
      title: String,
      type: {
        type: String,
        enum: ['pdf', 'pgn', 'link']
      },
      url: String,
      publicId: String,
      uploadedAt: Date
    }
  ],
  
  // Engagement
  completionStatistics: {
    totalStarted: {
      type: Number,
      default: 0
    },
    totalCompleted: {
      type: Number,
      default: 0
    },
    averageProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
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
chapterSchema.index({ course: 1, orderIndex: 1 });
chapterSchema.index({ course: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
