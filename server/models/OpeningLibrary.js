const mongoose = require('mongoose');

// ============================================
// CHESS OPENING LIBRARY SCHEMA
// ============================================
const openingLibrarySchema = new mongoose.Schema({
  // Opening Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  ecoCode: {
    type: String,
    unique: true,
    required: true // e.g., "C00", "E00"
  },
  
  description: {
    type: String,
    maxlength: 5000
  },
  
  // FEN Position
  startingFen: {
    type: String,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  
  currentFen: String,
  
  // Move Sequence
  moveSequence: [String], // Moves in long algebraic notation
  
  // Classification
  openingType: {
    type: String,
    enum: ['Open Game', 'Semi-Open Game', 'Closed Game', 'Semi-Closed Game', 'Irregular'],
    required: true
  },
  
  complexity: {
    type: String,
    enum: ['Simple', 'Moderate', 'Complex', 'Very Complex'],
    default: 'Moderate'
  },
  
  popularity: {
    type: String,
    enum: ['Very Popular', 'Popular', 'Less Popular', 'Rare'],
    default: 'Popular'
  },
  
  // Variations
  variations: [
    {
      name: String,
      moves: [String],
      assessment: String // e.g., "White advantage", "Equal", "Black advantage"
    }
  ],
  
  // Key Ideas
  strategicIdeas: [String],
  tacticalMotifs: [String],
  typicalPawns: [String],
  
  // Video Content
  videoTutorials: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  ],
  
  // Famous Games
  famousGames: [
    {
      gameId: String,
      whitePlayer: String,
      blackPlayer: String,
      year: Number,
      pgn: String,
      url: String
    }
  ],
  
  // Performance Statistics
  statistics: {
    whiteWinPercentage: Number,
    drawPercentage: Number,
    blackWinPercentage: Number,
    gamesPlayed: Number,
    averageRating: Number,
    topPlayerUsageCount: Number
  },
  
  // Marketplace fields
  isMarketplace: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrls: [{ title: String, type: { type: String, enum: ['pgn', 'video', 'pdf'] }, url: String }],
  enrollmentCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  
  // Tags & Metadata
  tags: [String],
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
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
openingLibrarySchema.index({ ecoCode: 1 });
openingLibrarySchema.index({ name: 'text' });
openingLibrarySchema.index({ tags: 1 });

module.exports = mongoose.model('OpeningLibrary', openingLibrarySchema);
