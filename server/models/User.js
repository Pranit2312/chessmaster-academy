const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'coach','admin'],
    default: 'student',
    required: true
  },
  age: {
    type: Number,
    default: 18,
    min: 5,
    max: 120
  },
  chessRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 4000
  },
  ratingType: {
    type: String,
    enum: ['FIDE', 'Chess.com', 'Lichess', 'National', 'Other'],
    default: 'Chess.com'
  },

  // Coach-specific fields
  experience: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 0 },
  specializations: [{ type: String }],
  bio: { type: String, maxlength: 1000 },
  title: {
    type: String,
    enum: ['GM', 'IM', 'FM', 'CM', 'NM', 'None'],
    default: 'None'
  },

  // Student fields
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  learningGoals: { type: String, maxlength: 500 },

  // Common fields
  profileImage: { type: String, default: '' },
  country: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },

  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  bannedAt: { type: Date, default: null },
  suspendedUntil: { type: Date, default: null },
  tournamentRating: { type: Number, default: 1200 },
  tournamentsPlayed: { type: Number, default: 0 },
  tournamentsWon: { type: Number, default: 0 },
  podiumFinishes: { type: Number, default: 0 },
  bestFinish: { type: String, default: '' },
  totalPrizeMoney: { type: Number, default: 0 },
  totalTournamentGames: { type: Number, default: 0 },

  slots: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot"
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const logger = require('../utils/logger');

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  logger.debug('Comparing password');
  const result = await bcrypt.compare(candidatePassword, this.password);
  logger.debug('Password comparison complete');
  return result;
};

module.exports = mongoose.model('User', userSchema);