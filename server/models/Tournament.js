const mongoose = require('mongoose');

// ============================================
// TOURNAMENT SCHEMA
// ============================================
const tournamentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: 150
  },
  
  description: {
    type: String,
    maxlength: 2000
  },
  
  // Organization
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tournament Details
  tournamentType: {
    type: String,
    enum: ['Round Robin', 'Swiss', 'Knockout', 'Ladder'],
    required: true
  },
  
  timeControl: {
    type: String,
    enum: ['Blitz', 'Rapid', 'Classical'],
    required: true
  },
  
  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
    max: 1000
  },
  
  minRating: {
    type: Number,
    default: 0
  },
  
  maxRating: {
    type: Number,
    default: 4000
  },
  
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All'],
    default: 'All'
  },
  
  // Participants
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      registeredAt: Date,
      status: {
        type: String,
        enum: ['registered', 'withdrew', 'disqualified'],
        default: 'registered'
      },
      seed: Number,
      rating: Number
    }
  ],
  
  registeredCount: {
    type: Number,
    default: 0
  },
  
  // Schedule
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  registrationDeadline: {
    type: Date,
    required: true
  },
  
  roundDates: [
    {
      roundNumber: Number,
      startDate: Date,
      endDate: Date
    }
  ],
  
  // Matches
  rounds: [
    {
      roundNumber: Number,
      matches: [
        {
          matchId: String,
          whitePlayer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          blackPlayer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          result: {
            type: String,
            enum: ['white_win', 'black_win', 'draw', 'pending'],
            default: 'pending'
          },
          pgn: String,
          scheduledAt: Date,
          completedAt: Date
        }
      ]
    }
  ],
  
  // Standings
  standings: [
    {
      position: Number,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      wins: {
        type: Number,
        default: 0
      },
      losses: {
        type: Number,
        default: 0
      },
      draws: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        default: 0
      },
      tiebreakScore: Number
    }
  ],
  
  // Prizes
  prizes: {
    totalPrizePool: {
      type: Number,
      default: 0
    },
    distribution: [
      {
        position: Number,
        amount: Number,
        description: String
      }
    ]
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Rules & Settings
  rules: String,
  
  allowDrawOffers: {
    type: Boolean,
    default: true
  },
  
  allowAdjournment: {
    type: Boolean,
    default: false
  },
  
  // Analysis
  statistics: {
    totalMatches: {
      type: Number,
      default: 0
    },
    completedMatches: {
      type: Number,
      default: 0
    },
    averageRating: Number,
    medianRating: Number
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
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ startDate: 1 });
tournamentSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
