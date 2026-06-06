const mongoose = require('mongoose');

// ============================================
// FORUM DISCUSSION SCHEMA
// ============================================
const discussionSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Discussion title is required'],
    trim: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: [true, 'Discussion content is required'],
    maxlength: 5000
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Context (Optional)
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['Technical', 'Conceptual', 'Resource', 'Off-Topic', 'Announcement'],
    default: 'Conceptual'
  },
  
  tags: [String],
  
  // Content Media
  attachments: [
    {
      type: String,
      url: String,
      publicId: String
    }
  ],
  
  // Engagement
  repliesCount: {
    type: Number,
    default: 0
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  
  likesCount: {
    type: Number,
    default: 0
  },
  
  isFollowed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  
  followersCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isPinned: {
    type: Boolean,
    default: false
  },
  
  isClosed: {
    type: Boolean,
    default: false
  },
  
  isSpam: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: ['active', 'pending_review', 'archived', 'deleted'],
    default: 'active'
  },
  
  // Moderation
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  modificationReason: String,
  
  reportCount: {
    type: Number,
    default: 0
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
discussionSchema.index({ author: 1 });
discussionSchema.index({ course: 1 });
discussionSchema.index({ status: 1 });
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ title: 'text', content: 'text' });

const Discussion = mongoose.model('Discussion', discussionSchema);

// ============================================
// FORUM REPLY SCHEMA
// ============================================
const replySchema = new mongoose.Schema({
  // Content
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    maxlength: 3000
  },
  
  // Relationships
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Nested replies (for comment threading)
  parentReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumReply',
    default: null
  },
  
  childReplies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumReply'
    }
  ],
  
  // Attachments
  attachments: [
    {
      type: String,
      url: String,
      publicId: String
    }
  ],
  
  // Engagement
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  
  likesCount: {
    type: Number,
    default: 0
  },
  
  // Marking as Solution
  isMarkedAsSolution: {
    type: Boolean,
    default: false
  },
  
  markedAsSolutionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editedAt: Date,
  
  editCount: {
    type: Number,
    default: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'pending_review', 'deleted'],
    default: 'active'
  },
  
  // Moderation
  reportCount: {
    type: Number,
    default: 0
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
replySchema.index({ discussion: 1 });
replySchema.index({ author: 1 });
replySchema.index({ createdAt: -1 });

const ForumReply = mongoose.model('ForumReply', replySchema);

module.exports = {
  Discussion,
  ForumReply
};
