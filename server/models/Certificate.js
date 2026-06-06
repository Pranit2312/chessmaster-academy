const mongoose = require('mongoose');

// ============================================
// CERTIFICATE SCHEMA
// ============================================
const certificateSchema = new mongoose.Schema({
  // Relationships
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  
  // Certificate Details
  certificateNumber: {
    type: String,
    unique: true,
    required: true // Format: CERT-YYYY-MMDD-XXXXX
  },
  
  certificateUrl: {
    publicId: String,
    url: String
  },
  
  // Completion Details
  completionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  finalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  totalLessonsCompleted: {
    type: Number,
    required: true
  },
  
  totalLessons: {
    type: Number,
    required: true
  },
  
  totalTimeSpent: {
    type: Number,
    default: 0 // in hours
  },
  
  // Certification Status
  status: {
    type: String,
    enum: ['issued', 'verified', 'revoked', 'expired'],
    default: 'issued'
  },
  
  // Skill Assessment
  skillsAcquired: [
    {
      skillName: String,
      proficiencyLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
      }
    }
  ],
  
  // Verification
  verificationCode: {
    type: String,
    unique: true,
    required: true // 6-digit code for certificate verification
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  issuedAt: {
    type: Date,
    default: Date.now
  },
  
  expiresAt: Date,
  
  revokedAt: Date,
  
  revokedReason: String,
  
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
certificateSchema.index({ student: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ issuedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
