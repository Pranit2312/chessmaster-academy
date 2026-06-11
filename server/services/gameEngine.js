const { Chess } = require('chess.js');
const Game = require('../models/Game');
const Rating = require('../models/Rating');
const User = require('../models/User');
const { calculateNewRating, getCategory, getScore } = require('./ratingSystem');
const logger = require('../utils/logger');

const CLOCK_TICK_MS = 1000;

class GameEngine {
  constructor() {
    this.activeGames = new Map();
    this.clockInterval = null;
  }

  startClockTick(io) {
    if (this.clockInterval) return;
    this.clockInterval = setInterval(() => this.tickClocks(io), CLOCK_TICK_MS);
    this.clockInterval.unref();
    logger.debug('Clock tick started');
  }

  stopClockTick() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  tickClocks(io) {
    const now = Date.now();
    for (const [gameId, gameData] of this.activeGames) {
      if (gameData.status !== 'active') continue;

      const turn = gameData.chess.turn();
      const colorKey = turn === 'w' ? 'white' : 'black';
      const elapsed = now - gameData.clocks.lastMoveAt;

      if (elapsed >= 1000) {
        gameData.clocks[colorKey] -= elapsed;
        gameData.clocks.lastMoveAt = now;

        if (gameData.clocks[colorKey] <= 0) {
          gameData.clocks[colorKey] = 0;
          const winner = colorKey === 'white' ? 'black' : 'white';
          const result = { winner, by: 'timeout', result: colorKey === 'white' ? '0-1' : '1-0' };
          gameData.status = 'completed';
          gameData._pendingResult = result;

          if (io) {
            io.to(`game:${gameId}`).emit('game:clock-flag', {
              color: colorKey,
              winner,
              result: result.result
            });

            this.finalizeGame(gameId, io);
          }
        }
      }

      // Emit clock sync every 1s to game room
      if (io) {
        io.to(`game:${gameId}`).emit('game:clock-sync', {
          white: gameData.clocks.white,
          black: gameData.clocks.black,
          turn: gameData.chess.turn()
        });
      }
    }
  }

  async finalizeGame(gameId, io) {
    const gameData = this.activeGames.get(gameId);
    if (!gameData || !gameData._pendingResult) return;

    const result = gameData._pendingResult;
    delete gameData._pendingResult;

    try {
      const game = await Game.findById(gameId);
      if (!game) return;

      game.status = 'completed';
      game.result = result.result;
      game.termination = result.by;
      game.fen = gameData.chess.fen();
      game.pgn = gameData.chess.pgn();
      game.moves = gameData.moveHistory;
      game.clocks = gameData.clocks;
      game.completedAt = new Date();
      await game.save();

      const ratingResult = await this.processRating(game, result.winner);

      if (io) {
        io.to(`game:${gameId}`).emit('game:over', {
          result: result.result,
          by: result.by,
          winner: result.winner,
          ratingChanges: ratingResult
        });
      }

      this.activeGames.delete(gameId);
    } catch (err) {
      logger.error('Failed to finalize game', err.message);
    }
  }

  createGameInstance(gameId, initialFen, timeControl, players) {
    const chess = new Chess(initialFen || undefined);
    return {
      chess,
      gameId,
      timeControl,
      players: players || [],
      clocks: {
        white: timeControl.initial * 60 * 1000,
        black: timeControl.initial * 60 * 1000,
        lastMoveAt: Date.now()
      },
      moveHistory: [],
      status: 'active',
      drawOfferedBy: null,
      _pendingResult: null
    };
  }

  getPlayerColor(gameData, userId) {
    const player = gameData.players.find(p => String(p.userId) === String(userId));
    return player ? player.color : null;
  }

  makeMove(gameData, userId, from, to, promotion = 'q') {
    const chess = gameData.chess;
    const turn = chess.turn();
    const colorKey = turn === 'w' ? 'white' : 'black';

    // Verify it's this player's turn
    const playerColor = this.getPlayerColor(gameData, userId);
    if (!playerColor) return { error: 'You are not a player in this game' };
    if (playerColor !== colorKey) return { error: 'Not your turn' };

    const now = Date.now();
    const elapsed = now - gameData.clocks.lastMoveAt;

    try {
      const move = chess.move({ from, to, promotion });
      if (!move) return { error: 'Invalid move' };

      gameData.clocks[colorKey] = Math.max(0, gameData.clocks[colorKey] - elapsed);
      gameData.clocks.lastMoveAt = now;

      // Add increment
      if (gameData.timeControl.increment > 0) {
        gameData.clocks[colorKey] += gameData.timeControl.increment * 1000;
      }

      const moveRecord = {
        moveNumber: chess.moveNumber(),
        san: move.san,
        uci: move.from + move.to + (move.promotion || ''),
        fen: chess.fen(),
        playerColor: turn,
        elapsed: Math.round(elapsed / 1000),
        clock: Math.round(gameData.clocks[colorKey] / 1000),
        timestamp: now
      };
      gameData.moveHistory.push(moveRecord);

      const result = this.checkGameEnd(chess, gameData.clocks);
      if (result) {
        gameData.status = 'completed';
        return { move: moveRecord, gameOver: true, result };
      }

      return { move: moveRecord, gameOver: false, fen: chess.fen(), turn: chess.turn() };
    } catch (e) {
      return { error: e.message };
    }
  }

  checkGameEnd(chess, clocks) {
    if (chess.isCheckmate()) return { winner: chess.turn() === 'w' ? 'black' : 'white', by: 'checkmate', result: chess.turn() === 'w' ? '0-1' : '1-0' };
    if (chess.isDraw()) {
      if (chess.isStalemate()) return { winner: null, by: 'stalemate', result: '0.5-0.5' };
      if (chess.isInsufficientMaterial()) return { winner: null, by: 'insufficient_material', result: '0.5-0.5' };
      if (chess.isThreefoldRepetition()) return { winner: null, by: 'threefold_repetition', result: '0.5-0.5' };
      if (chess.isDraw()) return { winner: null, by: 'agreement', result: '0.5-0.5' };
    }
    if (clocks.white <= 0) return { winner: 'black', by: 'timeout', result: '0-1' };
    if (clocks.black <= 0) return { winner: 'white', by: 'timeout', result: '1-0' };
    return null;
  }

  resign(chess, color) {
    return {
      winner: color === 'white' ? 'black' : 'white',
      by: 'resignation',
      result: color === 'white' ? '0-1' : '1-0'
    };
  }

  async saveGame(gameData, dbGame) {
    const chess = gameData.chess;
    dbGame.fen = chess.fen();
    dbGame.pgn = chess.pgn();
    dbGame.moves = gameData.moveHistory;
    dbGame.clocks = gameData.clocks;
    dbGame.moveTimes = gameData.moveHistory.map(m => m.elapsed);
    if (gameData.status === 'completed' || gameData._pendingResult) {
      dbGame.status = 'completed';
      dbGame.completedAt = new Date();
    }
    return dbGame.save();
  }

  async processRating(game, winnerId) {
    const timeControl = game.timeControl;
    const category = getCategory(timeControl.initial);

    const whitePlayer = game.players.find(p => p.color === 'white');
    const blackPlayer = game.players.find(p => p.color === 'black');

    let [whiteRating, blackRating] = await Promise.all([
      Rating.findOneAndUpdate(
        { user: whitePlayer.user },
        { $setOnInsert: { user: whitePlayer.user } },
        { upsert: true, new: true }
      ),
      Rating.findOneAndUpdate(
        { user: blackPlayer.user },
        { $setOnInsert: { user: blackPlayer.user } },
        { upsert: true, new: true }
      )
    ]);

    const wRating = whiteRating[category].rating;
    const bRating = blackRating[category].rating;
    const wScore = getScore(game.result, 'white');
    const bScore = getScore(game.result, 'black');

    const wNew = calculateNewRating(wRating, bRating, wScore);
    const bNew = calculateNewRating(bRating, wRating, bScore);

    const updateStats = (ratingDoc, cat, newRating, isWinner, isDraw) => {
      const update = {
        $set: { [`${cat}.rating`]: newRating },
        $inc: {
          [`${cat}.gamesPlayed`]: 1,
          [`${cat}.wins`]: isWinner ? 1 : 0,
          [`${cat}.draws`]: isDraw ? 1 : 0,
          [`${cat}.losses`]: !isWinner && !isDraw ? 1 : 0
        }
      };
      return ratingDoc.constructor.findByIdAndUpdate(ratingDoc._id, update, { new: true });
    };

    const isDraw = game.result === '0.5-0.5';
    const wIsWinner = game.result === '1-0';
    const bIsWinner = game.result === '0-1';

    const [updatedWhite, updatedBlack] = await Promise.all([
      updateStats(whiteRating, category, wNew, wIsWinner, isDraw),
      updateStats(blackRating, category, bNew, bIsWinner, isDraw)
    ]);

    whitePlayer.ratingBefore = wRating;
    whitePlayer.ratingAfter = wNew;
    whitePlayer.ratingChange = wNew - wRating;
    blackPlayer.ratingBefore = bRating;
    blackPlayer.ratingAfter = bNew;
    blackPlayer.ratingChange = bNew - bRating;

    await Promise.all([
      Rating.findByIdAndUpdate(whiteRating._id, {
        $push: { history: { category, rating: wNew, gameId: game._id } }
      }),
      Rating.findByIdAndUpdate(blackRating._id, {
        $push: { history: { category, rating: bNew, gameId: game._id } }
      })
    ]);

    return { whiteNew: wNew, blackNew: bNew, whiteChange: wNew - wRating, blackChange: bNew - bRating };
  }

  calculateAccuracy(moves, evaluationChanges) {
    if (!moves.length) return { white: 0, black: 0 };
    let whiteScore = 0, blackScore = 0;
    let whiteMoves = 0, blackMoves = 0;
    moves.forEach((m, i) => {
      const evalChange = evaluationChanges[i] || 0;
      const accuracy = Math.max(0, Math.min(100, 100 - Math.abs(evalChange) * 5));
      if (m.playerColor === 'w') {
        whiteScore += accuracy;
        whiteMoves++;
      } else {
        blackScore += accuracy;
        blackMoves++;
      }
    });
    return {
      white: whiteMoves ? Math.round(whiteScore / whiteMoves) : 0,
      black: blackMoves ? Math.round(blackScore / blackMoves) : 0
    };
  }

  calculateMistakes(moves, evaluationChanges) {
    let white = { mistakes: 0, blunders: 0, bestMoves: 0 };
    let black = { mistakes: 0, blunders: 0, bestMoves: 0 };
    moves.forEach((m, i) => {
      const change = Math.abs(evaluationChanges[i] || 0);
      if (m.playerColor === 'w') {
        if (change < 0.5) white.bestMoves++;
        else if (change < 1.5) white.mistakes++;
        else white.blunders++;
      } else {
        if (change < 0.5) black.bestMoves++;
        else if (change < 1.5) black.mistakes++;
        else black.blunders++;
      }
    });
    return { white, black };
  }
}

module.exports = new GameEngine();
