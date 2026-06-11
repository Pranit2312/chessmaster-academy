const OpeningLibrary = require('../models/OpeningLibrary');

const OPENINGS = [
  {
    name: 'Italian Game',
    ecoCode: 'C50',
    description: 'One of the oldest and most respected openings in chess. White develops the bishop to c4, targeting the f7 pawn and preparing to castle quickly.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3',
    moveSequence: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    openingType: 'Open Game',
    complexity: 'Moderate',
    popularity: 'Very Popular',
    difficulty: 'Beginner',
    variations: [
      { name: 'Giuoco Piano', moves: ['Bc5'], assessment: 'Equal' },
      { name: 'Two Knights Defense', moves: ['Nf6'], assessment: 'Equal' },
      { name: 'Hungarian Defense', moves: ['Be7'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Control the center with pawns', 'Develop pieces quickly', 'Target f7 weak square', 'Castle early'],
    tacticalMotifs: ['Fork on f7', 'Sacrifice on f7', 'Pin on c6 knight'],
    typicalPawns: ['d4 break', 'c3 support d4', 'e4-e5 advance'],
    tags: ['open game', 'classical', 'beginner-friendly'],
    statistics: { whiteWinPercentage: 45, drawPercentage: 28, blackWinPercentage: 27, gamesPlayed: 500000, averageRating: 1800 }
  },
  {
    name: 'Sicilian Defense',
    ecoCode: 'B90',
    description: 'The most popular response to 1.e4 at all levels. Black fights for the center with asymmetrical pawn structure leading to complex positions.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'c5'],
    openingType: 'Semi-Open Game',
    complexity: 'Complex',
    popularity: 'Very Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Najdorf Variation', moves: ['d6', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], assessment: 'Equal' },
      { name: 'Dragon Variation', moves: ['d6', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], assessment: 'Equal' },
      { name: 'Scheveningen Variation', moves: ['d6', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Fight for d4 square', 'Create pawn breaks', 'Control half-open c-file', 'Counter-attack on queenside'],
    tacticalMotifs: ['d4 sacrifice', 'Exchange sacrifice on c3', 'Queen and bishop battery'],
    typicalPawns: ['d6-e6 chain', 'a6-b5 expansion', 'd5 break by Black'],
    tags: ['semi-open', 'aggressive', 'popular'],
    statistics: { whiteWinPercentage: 42, drawPercentage: 25, blackWinPercentage: 33, gamesPlayed: 800000, averageRating: 2000 }
  },
  {
    name: 'Queen\'s Gambit',
    ecoCode: 'D06',
    description: 'A classical opening where White offers a pawn to gain control of the center. Made famous by the Netflix series.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['d4', 'd5', 'c4'],
    openingType: 'Closed Game',
    complexity: 'Moderate',
    popularity: 'Very Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Queen\'s Gambit Accepted', moves: ['dxc4'], assessment: 'Equal' },
      { name: 'Queen\'s Gambit Declined', moves: ['e6'], assessment: 'Equal' },
      { name: 'Slav Defense', moves: ['c6'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Control the center', 'Develop pieces harmoniously', 'Create pawn majority on queenside', 'Pressure d5 pawn'],
    tacticalMotifs: ['Isolated queen pawn positions', 'Minority attack', 'Hanging pawns in center'],
    typicalPawns: ['c4-d4 vs d5-e6', 'c4-c5 break', 'e3-e4 break'],
    tags: ['closed game', 'positional', 'solid'],
    statistics: { whiteWinPercentage: 48, drawPercentage: 30, blackWinPercentage: 22, gamesPlayed: 600000, averageRating: 1900 }
  },
  {
    name: 'Caro-Kann Defense',
    ecoCode: 'B10',
    description: 'A solid and reliable defense against 1.e4. Black aims for a safe pawn structure with good endgame chances.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'c6'],
    openingType: 'Semi-Open Game',
    complexity: 'Moderate',
    popularity: 'Popular',
    difficulty: 'Beginner',
    variations: [
      { name: 'Classical Variation', moves: ['d4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'], assessment: 'Equal' },
      { name: 'Advance Variation', moves: ['d4', 'd5', 'e5', 'Bf5'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Solid pawn chain', 'Good development for Black', 'Counter-attack in center', 'Strong endgame structure'],
    tacticalMotifs: ['d5 break', 'c5 break', 'Bf5 development'],
    typicalPawns: ['c6-d5 chain', 'c5 break', 'e6 break'],
    tags: ['semi-open', 'solid', 'beginner-friendly'],
    statistics: { whiteWinPercentage: 44, drawPercentage: 32, blackWinPercentage: 24, gamesPlayed: 300000, averageRating: 1700 }
  },
  {
    name: 'Ruy Lopez',
    ecoCode: 'C80',
    description: 'One of the most deeply analyzed openings in chess. White pressures Black\'s e5 pawn by threatening the knight that defends it.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3',
    moveSequence: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    openingType: 'Open Game',
    complexity: 'Very Complex',
    popularity: 'Very Popular',
    difficulty: 'Advanced',
    variations: [
      { name: 'Berlin Defense', moves: ['Nf6'], assessment: 'Equal' },
      { name: 'Morphy Defense', moves: ['a6'], assessment: 'Equal' },
      { name: 'Closed Defense', moves: ['a6', 'Ba4', 'Nf6', 'd3'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Pressure on e5', 'Control of center', 'Kingside attack potential', 'Long-term positional pressure'],
    tacticalMotifs: ['Bxc6 sacrifice', 'd4 break', 'c3 support d4', 'Marshall attack'],
    typicalPawns: ['c3-d4 center', 'e4-e5 advance', 'a6-b5 expansion by Black'],
    tags: ['open game', 'strategic', 'advanced'],
    statistics: { whiteWinPercentage: 46, drawPercentage: 30, blackWinPercentage: 24, gamesPlayed: 700000, averageRating: 2100 }
  },
  {
    name: 'French Defense',
    ecoCode: 'C11',
    description: 'A solid and strategic defense against 1.e4. Black creates a strong pawn chain and counters in the center.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'e6'],
    openingType: 'Semi-Open Game',
    complexity: 'Moderate',
    popularity: 'Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Advance Variation', moves: ['d4', 'd5', 'e5'], assessment: 'Slight White advantage' },
      { name: 'Classical Variation', moves: ['d4', 'd5', 'Nc3', 'Nf6'], assessment: 'Equal' },
      { name: 'Winawer Variation', moves: ['d4', 'd5', 'Nc3', 'Bb4'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Solid pawn chain e6-d5', 'Light-squared bishop problem', 'c5 and f6 breaks', 'Queenside counter-play'],
    tacticalMotifs: ['d5 break', 'c5 break', 'Knight sacrifice on d4'],
    typicalPawns: ['e6-d5 chain vs e5-d4', 'c5 break', 'f6 break'],
    tags: ['semi-open', 'strategic', 'solid'],
    statistics: { whiteWinPercentage: 45, drawPercentage: 30, blackWinPercentage: 25, gamesPlayed: 400000, averageRating: 1800 }
  },
  {
    name: 'King\'s Indian Defense',
    ecoCode: 'E90',
    description: 'A hypermodern defense where Black allows White to build a large center, then counter-attacks it.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['d4', 'Nf6', 'c4', 'g6'],
    openingType: 'Closed Game',
    complexity: 'Complex',
    popularity: 'Popular',
    difficulty: 'Advanced',
    variations: [
      { name: 'Classical Main Line', moves: ['Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'], assessment: 'Equal' },
      { name: 'Fianchetto Variation', moves: ['g3', 'Bg7', 'Bg2', 'd6', 'Nf3', 'O-O', 'O-O', 'Nbd7'], assessment: 'Equal' }
    ],
    strategicIdeas: ['King\'s fianchetto', 'Central counter-attack', 'Kingside attacking chances', 'Full center control for White'],
    tacticalMotifs: ['e5 break', 'f5 break', 'Exchange sacrifice on c3', 'King hunt'],
    typicalPawns: ['d6-e5 chain', 'f5-f4 advance', 'c6 break'],
    tags: ['closed game', 'hypermodern', 'aggressive'],
    statistics: { whiteWinPercentage: 48, drawPercentage: 25, blackWinPercentage: 27, gamesPlayed: 350000, averageRating: 2000 }
  },
  {
    name: 'London System',
    ecoCode: 'D02',
    description: 'A solid, system-based opening popular at club level. White develops in a consistent pattern regardless of Black\'s setup.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppp1ppp/pppp4/4p3/3P1B2/2N5/PPP1PPPP/R2QKBNR b KQkq - 1 3',
    moveSequence: ['d4', 'd5', 'Bf4', 'e6', 'Nf3', 'Nf6', 'e3', 'c5', 'c3'],
    openingType: 'Closed Game',
    complexity: 'Simple',
    popularity: 'Very Popular',
    difficulty: 'Beginner',
    variations: [
      { name: 'Standard Setup', moves: ['Nf6', 'e3', 'e6', 'Nf3', 'Be7', 'Bd3', 'O-O', 'O-O'], assessment: 'Equal' },
      { name: 'Aggressive Setup', moves: ['Bd3', 'Nf6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Solid piec development', 'Control e5 square', 'Kingside castling', 'Flexible pawn structure'],
    tacticalMotifs: ['e5 break', 'Bd3 sacrifice on h7', 'Ne5 outpost'],
    typicalPawns: ['c3-d4-e3 chain', 'c4 break', 'e4 break'],
    tags: ['closed game', 'system', 'beginner-friendly', 'popular'],
    statistics: { whiteWinPercentage: 46, drawPercentage: 28, blackWinPercentage: 26, gamesPlayed: 400000, averageRating: 1500 }
  },
  {
    name: 'Pirc Defense',
    ecoCode: 'B07',
    description: 'A hypermodern opening where Black allows White to occupy the center before attacking it.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'],
    openingType: 'Semi-Open Game',
    complexity: 'Moderate',
    popularity: 'Less Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Classical Variation', moves: ['Nf3', 'Bg7', 'Be2', 'O-O'], assessment: 'Slight White advantage' },
      { name: 'Austrian Attack', moves: ['f4', 'Bg7', 'Nf3', 'O-O', 'Bd3'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Hypermodern center control', 'Fianchetto bishop', 'Counter-attack', 'Flexible pawn structure'],
    tacticalMotifs: ['e5 break', 'c6 break', 'King safety', 'Central tension'],
    typicalPawns: ['e4-d4 vs d6', 'e5 advance', 'c6 break by Black'],
    tags: ['semi-open', 'hypermodern', 'flexible'],
    statistics: { whiteWinPercentage: 50, drawPercentage: 25, blackWinPercentage: 25, gamesPlayed: 150000, averageRating: 1700 }
  },
  {
    name: 'English Opening',
    ecoCode: 'A20',
    description: 'A flexible flank opening where White starts with c4 instead of d4 or e4, often leading to complex positional play.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['c4'],
    openingType: 'Closed Game',
    complexity: 'Moderate',
    popularity: 'Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Symmetrical Variation', moves: ['c5'], assessment: 'Equal' },
      { name: 'Reversed Sicilian', moves: ['e5', 'Nc3', 'Nf6', 'g3'], assessment: 'Equal' },
      { name: 'Mikenas Variation', moves: ['e6', 'Nf3', 'Nf6', 'g3', 'd5'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Control d5 square', 'Flexible pawn structure', 'Slow center buildup', 'Kingside fianchetto'],
    tacticalMotifs: ['d4 break', 'e4 break', 'Minority attack', 'Hedgehog setups'],
    typicalPawns: ['c4-d4-e3', 'c4-d3-e4', 'b3-c4 chain'],
    tags: ['flank opening', 'flexible', 'positional'],
    statistics: { whiteWinPercentage: 47, drawPercentage: 28, blackWinPercentage: 25, gamesPlayed: 250000, averageRating: 1900 }
  },
  {
    name: 'Nimzo-Indian Defense',
    ecoCode: 'E20',
    description: 'A hypermodern defense where Black pins White\'s knight on c3, fighting for control of the center without occupying it directly.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkb1r/pppppppp/5n2/8/3P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 1 3',
    moveSequence: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'],
    openingType: 'Closed Game',
    complexity: 'Complex',
    popularity: 'Popular',
    difficulty: 'Advanced',
    variations: [
      { name: 'Classical Variation', moves: ['e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5', 'O-O'], assessment: 'Equal' },
      { name: 'Rubinstein Variation', moves: ['e3', 'O-O', 'Bd3', 'd5', 'a3', 'Bxc3', 'bxc3'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Control e4 square', 'Double White\'s c-pawns', 'Active piece play', 'Flexible pawn structure'],
    tacticalMotifs: ['Pin on c3', 'e4 break', 'd5 break', 'Bxc3 disrupting White\'s structure'],
    typicalPawns: ['c4-d4 vs e6-d5', 'c5 break by Black', 'e4 break by White'],
    tags: ['closed game', 'hypermodern', 'positional'],
    statistics: { whiteWinPercentage: 46, drawPercentage: 32, blackWinPercentage: 22, gamesPlayed: 350000, averageRating: 2100 }
  },
  {
    name: 'Grünfeld Defense',
    ecoCode: 'D80',
    description: 'A sharp and dynamic defense where Black allows White to build a massive center, then attacks it with pieces.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkb1r/pppppppp/5n2/8/3P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 1 3',
    moveSequence: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'],
    openingType: 'Closed Game',
    complexity: 'Very Complex',
    popularity: 'Popular',
    difficulty: 'Advanced',
    variations: [
      { name: 'Exchange Variation', moves: ['cxd5', 'Nxd5', 'e4', 'Nxc3', 'bxc3', 'Bg7'], assessment: 'Equal' },
      { name: 'Russian System', moves: ['Nf3', 'Bg7', 'Qb3', 'dxc4', 'Qxc4', 'O-O', 'e4'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Attack White\'s center', 'Fianchetto king bishop', 'Pressure d4', 'Dynamic piece play'],
    tacticalMotifs: ['d5 break', 'c5 break', 'Exchange sacrifice on c3', 'Queen and bishop battery'],
    typicalPawns: ['c4-d4-e4 center', 'c5 break', 'e6 break'],
    tags: ['closed game', 'hypermodern', 'dynamic'],
    statistics: { whiteWinPercentage: 48, drawPercentage: 25, blackWinPercentage: 27, gamesPlayed: 280000, averageRating: 2200 }
  },
  {
    name: 'Queen\'s Indian Defense',
    ecoCode: 'E15',
    description: 'A solid hypermodern defense where Black fianchettoes the queen\'s bishop to control the center from a distance.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkb1r/pppppppp/5n2/8/3P4/2N5/PPP1PPPP/R1BQKBNR w KQkq - 1 3',
    moveSequence: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'],
    openingType: 'Closed Game',
    complexity: 'Moderate',
    popularity: 'Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Classical Variation', moves: ['e3', 'Bb7', 'Bd3', 'Be7', 'O-O', 'O-O', 'b3'], assessment: 'Equal' },
      { name: 'Fianchetto Variation', moves: ['g3', 'Bb7', 'Bg2', 'Be7', 'O-O', 'O-O'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Fianchetto queen bishop', 'Pressure e4', 'Flexible pawn structure', 'Solid development'],
    tacticalMotifs: ['Bb7 pressure on e4', 'd5 break', 'c5 break', 'Ne4 outpost'],
    typicalPawns: ['c4-d4 vs e6-d5', 'b6-c5 chain', 'd5 break'],
    tags: ['closed game', 'hypermodern', 'solid'],
    statistics: { whiteWinPercentage: 44, drawPercentage: 35, blackWinPercentage: 21, gamesPlayed: 200000, averageRating: 2000 }
  },
  {
    name: 'King\'s Gambit',
    ecoCode: 'C30',
    description: 'An aggressive opening where White sacrifices a pawn for rapid development and attacking chances.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'e5', 'f4'],
    openingType: 'Open Game',
    complexity: 'Complex',
    popularity: 'Less Popular',
    difficulty: 'Advanced',
    variations: [
      { name: 'Accepted', moves: ['exf4', 'Nf3', 'd6', 'Bc4', 'h6'], assessment: 'Slight White advantage' },
      { name: 'Declined', moves: ['Bc5', 'Nf3', 'd6', 'c3'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Rapid development', 'Control center', 'Kingside attack', 'Sacrifice for initiative'],
    tacticalMotifs: ['Bxf7 sacrifice', 'Nxe5', 'Qg4 attack', 'f5 push'],
    typicalPawns: ['e4-f4 chain', 'd4 break', 'g3 support f4'],
    tags: ['open game', 'aggressive', 'romantic'],
    statistics: { whiteWinPercentage: 48, drawPercentage: 18, blackWinPercentage: 34, gamesPlayed: 150000, averageRating: 2000 }
  },
  {
    name: 'Vienna Game',
    ecoCode: 'C25',
    description: 'A flexible opening where White delays Nf3 in favor of Nc3, keeping options open for f4 or Bc4.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'e5', 'Nc3'],
    openingType: 'Open Game',
    complexity: 'Moderate',
    popularity: 'Less Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Max Lange Defense', moves: ['Nf6', 'Bc4', 'Nc6', 'd3', 'Bb4'], assessment: 'Equal' },
      { name: 'Vienna Gambit', moves: ['Nf6', 'f4', 'd5', 'fxe5', 'Nxe4'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Flexible development', 'f4 push', 'Kingside attack', 'Control d5'],
    tacticalMotifs: ['f4 break', 'Nf3-e5', 'Bc4 targeting f7'],
    typicalPawns: ['e4-f4 chain', 'd3 support center'],
    tags: ['open game', 'flexible', 'less common'],
    statistics: { whiteWinPercentage: 46, drawPercentage: 24, blackWinPercentage: 30, gamesPlayed: 80000, averageRating: 1700 }
  },
  {
    name: 'Alekhine Defense',
    ecoCode: 'B02',
    description: 'A hypermodern defense where Black invites White to overextend the center, then attacks it.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'Nf6'],
    openingType: 'Semi-Open Game',
    complexity: 'Moderate',
    popularity: 'Less Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Four Pawns Attack', moves: ['e5', 'Nd5', 'c4', 'Nb6', 'f4', 'd6', 'Be3'], assessment: 'Slight White advantage' },
      { name: 'Modern Variation', moves: ['e5', 'Nd5', 'd4', 'd6', 'Nf3', 'Bg4'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Provoke center advance', 'Attack extended pawns', 'Knight forays', 'Counter-attack'],
    tacticalMotifs: ['d6 break', 'Nf6-d5-e3', 'c5 break', 'Pawn center pressure'],
    typicalPawns: ['e5-d4-c4 vs d6', 'd6 break', 'c5 break'],
    tags: ['semi-open', 'hypermodern', 'unusual'],
    statistics: { whiteWinPercentage: 52, drawPercentage: 20, blackWinPercentage: 28, gamesPlayed: 120000, averageRating: 1800 }
  },
  {
    name: 'Scandinavian Defense',
    ecoCode: 'B01',
    description: 'An immediate attack on White\'s center pawn. Black develops the queen early, aiming for simplification.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'd5'],
    openingType: 'Semi-Open Game',
    complexity: 'Simple',
    popularity: 'Popular',
    difficulty: 'Beginner',
    variations: [
      { name: 'Main Line', moves: ['exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3'], assessment: 'Slight White advantage' },
      { name: 'Mieses-Kotroc Variation', moves: ['exd5', 'Nf6', 'd4', 'Nxd5', 'Nf3'], assessment: 'Equal' }
    ],
    strategicIdeas: ['Challenge center immediately', 'Quick development', 'Safe queen position', 'Simplify when ahead'],
    tacticalMotifs: ['Qxd5 gaining tempo', 'Bf5 development', 'c6 break'],
    typicalPawns: ['d5 isolated', 'c6-d5 chain'],
    tags: ['semi-open', 'direct', 'beginner-friendly'],
    statistics: { whiteWinPercentage: 48, drawPercentage: 20, blackWinPercentage: 32, gamesPlayed: 250000, averageRating: 1500 }
  },
  {
    name: 'Petrov Defense',
    ecoCode: 'C41',
    description: 'A symmetrical defense where Black copies White\'s moves, aiming for early simplification.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 3',
    moveSequence: ['e4', 'e5', 'Nf3', 'Nf6'],
    openingType: 'Open Game',
    complexity: 'Moderate',
    popularity: 'Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Classical Variation', moves: ['Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5', 'Bd3'], assessment: 'Equal' },
      { name: 'Steinitz Variation', moves: ['d4', 'Nxe4', 'Bd3', 'd5', 'Nxe5', 'Nd7'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Symmetry and equality', 'Central control', 'Simplification', 'Solid development'],
    tacticalMotifs: ['Nxe4 fork', 'd4 break', 'Knight outposts'],
    typicalPawns: ['e4-e5 tension', 'd4-d5 advance'],
    tags: ['open game', 'solid', 'symmetrical'],
    statistics: { whiteWinPercentage: 38, drawPercentage: 35, blackWinPercentage: 27, gamesPlayed: 280000, averageRating: 1900 }
  },
  {
    name: 'Modern Defense',
    ecoCode: 'B06',
    description: 'A hypermodern defense where Black fianchettoes the king bishop and allows White to occupy the center.',
    startingFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    moveSequence: ['e4', 'g6'],
    openingType: 'Semi-Open Game',
    complexity: 'Moderate',
    popularity: 'Less Popular',
    difficulty: 'Intermediate',
    variations: [
      { name: 'Standard Line', moves: ['d4', 'Bg7', 'Nf3', 'd6', 'Bc4', 'Nf6'], assessment: 'Equal' },
      { name: 'Pseudo-Austrian Attack', moves: ['d4', 'Bg7', 'f4', 'd6', 'Nf3', 'Nf6'], assessment: 'Slight White advantage' }
    ],
    strategicIdeas: ['Flexibility', 'Fianchetto bishop', 'Center counter-attack', 'Delayed piece commitment'],
    tacticalMotifs: ['c5 break', 'd5 break', 'Bg7 long diagonal'],
    typicalPawns: ['d6 chain', 'c6-c5 expansion'],
    tags: ['semi-open', 'hypermodern', 'flexible'],
    statistics: { whiteWinPercentage: 50, drawPercentage: 22, blackWinPercentage: 28, gamesPlayed: 100000, averageRating: 1800 }
  }
];

async function seedOpenings() {
  const count = await OpeningLibrary.countDocuments();
  if (count > 5) {
    console.log(`OpeningLibrary already has ${count} entries, skipping seed`);
    return count;
  }

  let created = 0;
  for (const opening of OPENINGS) {
    const exists = await OpeningLibrary.findOne({ ecoCode: opening.ecoCode });
    if (!exists) {
      await OpeningLibrary.create(opening);
      created++;
    }
  }
  console.log(`Seeded ${created} openings to OpeningLibrary`);
  return created;
}

async function ensureOpenings() {
  const count = await OpeningLibrary.countDocuments();
  if (count < 5) {
    return await seedOpenings();
  }
  return count;
}

module.exports = { seedOpenings, ensureOpenings, OPENINGS };
