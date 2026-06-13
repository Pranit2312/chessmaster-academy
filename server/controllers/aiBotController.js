const BotGame = require('../models/BotGame');
const { getBotMove, DIFFICULTY_MAP } = require('../services/aiEngineService');
const { Chess } = require('chess.js');

exports.startBotGame = async (req, res) => {
  try {
    const { difficulty = 5, playerColor = 'w' } = req.body;

    const actualColor = playerColor === 'random'
      ? (Math.random() < 0.5 ? 'w' : 'b')
      : playerColor;

    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const chess = new Chess(startFen);

    const game = await BotGame.create({
      user: req.user._id,
      fen: startFen,
      difficulty,
      playerColor: actualColor,
      startedAt: new Date()
    });

    if (actualColor === 'b') {
      const botResult = await getBotMove(startFen, difficulty);
      if (botResult.move) {
        const chessAfter = new Chess();
        chessAfter.move(botResult.move.san);
        game.moves.push({
          moveNumber: 1,
          san: botResult.move.san,
          fen: chessAfter.fen(),
          by: 'bot',
          eval: botResult.move.eval || 0
        });
        game.fen = chessAfter.fen();
        game.pgn = `1. ${botResult.move.san}`;
        game.lastMoveAt = new Date();
      }
    }

    await game.save();

    const diffConfig = DIFFICULTY_MAP[difficulty] || DIFFICULTY_MAP[5];

    res.json({
      success: true,
      game: {
        _id: game._id,
        fen: game.fen,
        difficulty: game.difficulty,
        difficultyLabel: diffConfig.label,
        difficultyElo: diffConfig.elo,
        playerColor: actualColor,
        result: game.result,
        moves: game.moves,
        startedAt: game.startedAt
      }
    });
  } catch (error) {
    console.error('Bot game start error:', error);
    res.status(500).json({ success: false, message: 'Failed to start bot game', error: error.message });
  }
};

exports.makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { move: playerMoveSan } = req.body;

    const game = await BotGame.findOne({ _id: gameId, user: req.user._id });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    if (game.result !== 'playing') {
      return res.status(400).json({ success: false, message: 'Game is already over' });
    }

    const chess = new Chess(game.fen);

    if (!playerMoveSan) {
      return res.status(400).json({ success: false, message: 'Move is required' });
    }

    let playerMove;
    try {
      playerMove = chess.move(playerMoveSan);
    } catch {
      const possibleMoves = chess.moves().filter(m => m.toLowerCase().startsWith(playerMoveSan.toLowerCase()));
      if (possibleMoves.length === 1) {
        playerMove = chess.move(possibleMoves[0]);
      } else if (possibleMoves.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Ambiguous move',
          possibleMoves: possibleMoves
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid move: ${playerMoveSan}`,
          validMoves: chess.moves()
        });
      }
    }

    const moveNumber = game.moves.length + 1;
    game.moves.push({
      moveNumber: Math.ceil(moveNumber / 2),
      san: playerMove.san,
      uci: playerMove.san,
      fen: chess.fen(),
      by: 'player',
      eval: 0
    });
    game.fen = chess.fen();
    game.lastMoveAt = new Date();

    if (chess.isGameOver()) {
      game.result = getResult(chess);
      game.completedAt = new Date();
      game.pgn = buildPgn(game.moves);
      await game.save();
      return res.json({
        success: true,
        gameOver: true,
        result: game.result,
        fen: game.fen,
        lastMove: { san: playerMove.san, by: 'player' },
        moves: game.moves
      });
    }

    const botResult = await getBotMove(chess.fen(), game.difficulty);

    if (botResult.move) {
      const chessAfter = new Chess(chess.fen());
      chessAfter.move(botResult.move.san);
      game.moves.push({
        moveNumber: Math.ceil((moveNumber + 1) / 2),
        san: botResult.move.san,
        uci: botResult.move.uci,
        fen: chessAfter.fen(),
        by: 'bot',
        eval: botResult.move.eval || 0
      });
      game.fen = chessAfter.fen();
      game.lastMoveAt = new Date();

      if (botResult.gameOver || chessAfter.isGameOver()) {
        game.result = botResult.result || getResult(chessAfter);
        game.completedAt = new Date();
      }
    }

    game.pgn = buildPgn(game.moves);
    await game.save();

    res.json({
      success: true,
      gameOver: game.result !== 'playing',
      result: game.result,
      fen: game.fen,
      lastMove: { san: playerMove.san, by: 'player' },
      botMove: botResult.move ? { san: botResult.move.san, eval: botResult.move.eval } : null,
      moves: game.moves
    });
  } catch (error) {
    console.error('Bot game move error:', error);
    res.status(500).json({ success: false, message: 'Failed to process move', error: error.message });
  }
};

exports.getGame = async (req, res) => {
  try {
    const game = await BotGame.findOne({ _id: req.params.gameId, user: req.user._id }).lean();
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get game', error: error.message });
  }
};

exports.getGames = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status === 'active') query.result = 'playing';
    else if (status === 'completed') query.result = { $ne: 'playing' };

    const games = await BotGame.find(query)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await BotGame.countDocuments(query);

    res.json({ success: true, games, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get games', error: error.message });
  }
};

exports.resignGame = async (req, res) => {
  try {
    const game = await BotGame.findOne({ _id: req.params.gameId, user: req.user._id });
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.result !== 'playing') return res.status(400).json({ success: false, message: 'Game already finished' });

    game.result = game.playerColor === 'w' ? 'black_win' : 'white_win';
    game.completedAt = new Date();
    game.pgn = buildPgn(game.moves);
    await game.save();

    res.json({ success: true, message: 'Resigned', result: game.result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resign', error: error.message });
  }
};

exports.analyzeBotGame = async (req, res) => {
  try {
    const game = await BotGame.findOne({ _id: req.params.gameId, user: req.user._id });
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    if (game.result === 'playing') return res.status(400).json({ success: false, message: 'Game is still in progress' });

    const { StockfishAnalysis } = require('../models/Analysis');
    const pgn = game.pgn || buildPgn(game.moves);

    const analysis = await StockfishAnalysis.create({
      user: req.user._id,
      pgn,
      whitePlayer: game.playerColor === 'w' ? req.user.name : 'AI Bot',
      blackPlayer: game.playerColor === 'b' ? req.user.name : 'AI Bot',
      depth: 18,
      status: 'queued'
    });

    game.analysis = analysis._id;
    await game.save();

    const queueService = require('../services/analysisQueueService');
    queueService.processNextInQueue().catch(() => {});

    res.json({ success: true, analysisId: analysis._id, message: 'Analysis queued' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to queue analysis', error: error.message });
  }
};

function getResult(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 'black_win' : 'white_win';
  if (chess.isDraw() || chess.isStalemate()) return 'draw';
  return 'draw';
}

function buildPgn(moves) {
  let pgn = '';
  let moveNum = 1;
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) pgn += `${moveNum}. `;
    pgn += `${moves[i].san} `;
    if (i % 2 === 1) moveNum++;
  }
  return pgn.trim();
}
