const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat',
    maxlength: 200
  },
  messages: [chatMessageSchema],
  context: {
    type: String,
    enum: ['general', 'game_analysis', 'opening_advice', 'tactics', 'endgame', 'strategy', 'course_help'],
    default: 'general'
  },
  relatedGame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockfishAnalysis'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

aiChatSchema.index({ user: 1, lastActivity: -1 });
aiChatSchema.index({ user: 1, context: 1 });

module.exports = mongoose.model('AiChat', aiChatSchema);
