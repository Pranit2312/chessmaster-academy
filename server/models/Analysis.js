const mongoose = require('mongoose');

// ============================================
// STOCKFISH ANALYSIS SCHEMA
// ============================================
const stockfishAnalysisSchema = new mongoose.Schema({
  // Game Information
  gameId: String,
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // PGN Data
  pgn: {
    type: String,
    required: true
  },
  
  whitePlayer: String,
  blackPlayer: String,
  event: String,
  site: String,
  date: String,
  
  // Analysis Settings
  depth: {
    type: Number,
    default: 25,
    min: 10,
    max: 50
  },
  
  engine: {
    type: String,
    default: 'Stockfish 15',
    enum: ['Stockfish 14', 'Stockfish 15', 'Stockfish 16']
  },
  
  // Move Analysis
  moves: [
    {
      moveNumber: Number,
      move: String,
      san: String, // Standard Algebraic Notation
      uci: String, // UCI notation
      fen: String,
      
      // Evaluation before move
      evaluationBefore: {
        type: Number, // Centipawns
      },
      
      // Evaluation after move
      evaluationAfter: {
        type: Number,
      },
      
      // Best move suggestion
      bestMove: String,
      bestMoveEval: Number,
      
      // Mistakes
      isMistake: Boolean,
      mistakeType: {
        type: String,
        enum: ['Inaccuracy', 'Mistake', 'Blunder'],
      },
      
      lossOfEval: Number,
      
      // Depth of analysis
      depth: Number,
      
      // Top variations
      topVariations: [
        {
          variation: [String],
          evaluation: Number
        }
      ]
    }
  ],
  
  // Game Summary
  summary: {
    totalMoves: Number,
    inaccuracies: {
      type: Number,
      default: 0
    },
    mistakes: {
      type: Number,
      default: 0
    },
    blunders: {
      type: Number,
      default: 0
    },
    whiteAccuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    blackAccuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    averageDepth: Number
  },
  
  // Phase Analysis
  phaseAnalysis: {
    openingPhase: {
      moves: Number,
      accuracy: Number
    },
    middleGamePhase: {
      moves: Number,
      accuracy: Number
    },
    endGamePhase: {
      moves: Number,
      accuracy: Number
    }
  },
  
  // Opening Data
  opening: {
    name: String,
    ecoCode: String,
    moves: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['queued', 'analyzing', 'completed', 'failed'],
    default: 'queued'
  },
  
  // Performance
  analysisTime: Number, // in seconds
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: Date
}, { timestamps: true });

// Indexes
stockfishAnalysisSchema.index({ user: 1 });
stockfishAnalysisSchema.index({ status: 1 });
stockfishAnalysisSchema.index({ createdAt: -1 });

// ============================================
// PAYMENT SCHEMA (Extended from existing)
// ============================================
const paymentSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment Source
  source: {
    type: String,
    enum: ['course_purchase', 'tournament_entry', 'coaching_session', 'subscription'],
    required: true
  },
  
  sourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Payment Details
  razorpayOrderId: {
    type: String,
    required: true
  },
  
  razorpayPaymentId: String,
  
  razorpaySignature: String,
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  discount: {
    type: Number,
    default: 0
  },
  
  tax: {
    type: Number,
    default: 0
  },
  
  finalAmount: {
    type: Number,
    required: true
  },
  
  // Payment Method
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    default: 'upi'
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Refund Information
  refund: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    razorpayRefundId: String
  },
  
  // Metadata
  description: String,
  
  notes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: Date,
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = {
  StockfishAnalysis: mongoose.model('StockfishAnalysis', stockfishAnalysisSchema),
  Payment: mongoose.model('CoursesPayment', paymentSchema)
};
