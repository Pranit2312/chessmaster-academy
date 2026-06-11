const mongoose = require('mongoose');

// ============================================
// COURSE SCHEMA
// ============================================
const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
    minlength: [5, 'Title must be at least 5 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    sparse: true
  },
  
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  
  // Coach/Instructor
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor must be specified']
  },
  
  // Media
  thumbnail: {
    publicId: String,
    url: {
      type: String,
      default: 'https://via.placeholder.com/400x300?text=Chess+Course'
    }
  },
  
  previewVideo: {
    publicId: String,
    url: String,
    duration: Number // in seconds
  },
  
  // Course Configuration
  pricing: {
    isFree: {
      type: Boolean,
      default: false
    },
    
    price: {
      type: Number,
      default: 0,
      validate: {
        validator: function() {
          return this.isFree || this.pricing.price > 0;
        },
        message: 'Price must be greater than 0 for paid courses'
      }
    },
    
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    effectivePrice: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  category: {
    type: String,
    enum: ['Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game', 'All Levels', 'Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Spanish', 'French', 'German', 'Russian', 'Hindi']
  },
  
  duration: {
    type: Number,
    default: 0 // in hours
  },
  
  // Learning Objectives
  objectives: [
    {
      type: String,
      maxlength: 200
    }
  ],
  
  prerequisites: [
    {
      type: String,
      maxlength: 200
    }
  ],
  
  targetAudience: [
    {
      type: String,
      enum: ['Beginners', 'Intermediate', 'Advanced', 'Competitive Players']
    }
  ],
  
  // Course Content Structure
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter'
    }
  ],
  
  totalLessons: {
    type: Number,
    default: 0
  },
  
  totalVideoDuration: {
    type: Number,
    default: 0 // in minutes
  },
  
  // Engagement & Ratings
  enrollmentCount: {
    type: Number,
    default: 0
  },
  
  completionCount: {
    type: Number,
    default: 0
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
  },
  
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }
  ],
  
  // Status & Publishing
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'published', 'rejected', 'archived'],
    default: 'draft'
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  publishedAt: Date,
  
  // Moderation
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  rejectionReason: String,
  
  // SEO
  tags: [
    {
      type: String,
      lowercase: true
    }
  ],
  
  seoMetaDescription: {
    type: String,
    maxlength: 160
  },
  
  // Analytics Fields
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  isFeatured: { type: Boolean, default: false },
  viewCount: {
    type: Number,
    default: 0
  },
  
  searchKeywords: [String],
  
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

// Indexes for performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ 'pricing.isFree': 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
