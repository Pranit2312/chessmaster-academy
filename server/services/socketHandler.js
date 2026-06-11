const { Chess } = require('chess.js');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const Rating = require('../models/Rating');
const gameEngine = require('./gameEngine');
const matchmaking = require('./matchmakingService');
const { getCategory } = require('./ratingSystem');
const { queueGameAnalysis } = require('../services/analysisQueueService');
const logger = require('../utils/logger');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.onlineUsers = new Map();
    this.gameRooms = new Map();
    this.setupMatchmaking();
  }

  setupMatchmaking() {
    matchmaking.onMatch = (match) => this.handleMatchFound(match);
    matchmaking.start();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Authentication required'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return next(new Error('User not found'));
        socket.user = user;
        next();
      } catch (e) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => this.handleConnection(socket));
    gameEngine.startClockTick(this.io);
  }

  handleConnection(socket) {
    const user = socket.user;
    this.onlineUsers.set(user._id.toString(), { socketId: socket.id, username: user.name, userId: user._id });
    socket.join(`user:${user._id}`);

    socket.emit('connected', { userId: user._id, username: user.name });
    this.broadcastOnlineUsers();

    socket.on('queue:join', (data) => this.handleQueueJoin(socket, data));
    socket.on('queue:leave', (data) => this.handleQueueLeave(socket, data));
    socket.on('game:move', (data) => this.handleGameMove(socket, data));
    socket.on('game:resign', (data) => this.handleResign(socket, data));
    socket.on('game:draw-offer', (data) => this.handleDrawOffer(socket, data));
    socket.on('game:draw-response', (data) => this.handleDrawResponse(socket, data));
    socket.on('game:abort', (data) => this.handleAbort(socket, data));
    socket.on('game:rematch', (data) => this.handleRematch(socket, data));
    socket.on('spectate:join', (data) => this.handleSpectateJoin(socket, data));
    socket.on('spectate:leave', (data) => this.handleSpectateLeave(socket, data));
    socket.on('friend:challenge', (data) => this.handleFriendChallenge(socket, data));
    socket.on('friend:challenge-response', (data) => this.handleChallengeResponse(socket, data));
    socket.on('game:join', (data) => this.handleGameJoin(socket, data));
    socket.on('game:leave', (data) => this.handleGameLeave(socket, data));
    socket.on('follow:coach', (data) => this.handleFollowCoach(socket, data));
    socket.on('unfollow:coach', (data) => this.handleUnfollowCoach(socket, data));

    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  async handleQueueJoin(socket, data) {
    const user = socket.user;
    const category = data.category || 'blitz';
    const rating = data.rating || 1200;

    const result = matchmaking.joinQueue(
      user._id.toString(),
      user.name,
      rating,
      category,
      data.ratingRange,
      data.timeControlLabel
    );

    if (result.error) return socket.emit('queue:error', { message: result.error });

    socket.join(`queue:${category}`);
    socket.emit('queue:joined', { category, position: result.position });
    this.broadcastQueueSizes();
  }

  handleQueueLeave(socket, data) {
    matchmaking.leaveQueue(socket.user._id.toString(), data?.category);
    socket.emit('queue:left');
    this.broadcastQueueSizes();
  }

  async handleMatchFound(match) {
    const gameId = new (require('mongoose').Types.ObjectId)();
    const timeControl = match.timeControl;

    try {
      await Game.create({
        _id: gameId,
        players: [
          { user: match.players[0].userId, color: 'white' },
          { user: match.players[1].userId, color: 'black' }
        ],
        status: 'active',
        timeControl,
        timeControlLabel: match.timeControlLabel,
        rated: match.rated !== false,
        clocks: {
          white: timeControl.initial * 60 * 1000,
          black: timeControl.initial * 60 * 1000,
          lastMoveAt: Date.now()
        },
        startedAt: new Date()
      });
    } catch (err) {
      logger.error('Failed to create game document', err.message);
      match.players.forEach(p => {
        this.io.to(`user:${p.userId}`).emit('queue:error', {
          message: 'Failed to create game. Please try again.'
        });
      });
      return;
    }

    const players = [
      { userId: match.players[0].userId.toString(), color: 'white' },
      { userId: match.players[1].userId.toString(), color: 'black' }
    ];
    gameEngine.activeGames.set(gameId.toString(), gameEngine.createGameInstance(gameId.toString(), undefined, timeControl, players));

    const room = `game:${gameId}`;
    match.players.forEach(p => {
      this.io.to(`user:${p.userId}`).emit('match:found', {
        gameId: gameId.toString(),
        opponent: match.players.find(op => op.userId !== p.userId),
        timeControl: match.timeControl,
        timeControlLabel: match.timeControlLabel,
        color: p.userId === match.players[0].userId ? 'white' : 'black'
      });
    });
  }

  async handleGameMove(socket, data) {
    const { gameId, from, to, promotion } = data;
    const gameData = gameEngine.activeGames.get(gameId);
    if (!gameData) return socket.emit('game:error', { message: 'Game not found' });

    if (gameData.status !== 'active') return socket.emit('game:error', { message: 'Game is over' });

    const result = gameEngine.makeMove(gameData, socket.user._id.toString(), from, to, promotion);
    if (result.error) return socket.emit('game:error', { message: result.error });

    const room = `game:${gameId}`;
    this.io.to(room).emit('game:move-made', result);

    if (result.gameOver) {
      await this._finalizeGame(gameId, result.result);
    }
  }

  async _finalizeGame(gameId, moveResult) {
    const gameData = gameEngine.activeGames.get(gameId);
    if (!gameData) return;

    try {
      const game = await Game.findById(gameId);
      if (!game || game.status === 'completed') return;

      game.status = 'completed';
      game.result = moveResult.result;
      game.termination = moveResult.by;
      game.fen = gameData.chess.fen();
      game.pgn = gameData.chess.pgn();
      game.moves = gameData.moveHistory;
      game.clocks = gameData.clocks;
      game.completedAt = new Date();
      await game.save();

      const ratingResult = await gameEngine.processRating(game, moveResult.winner);
      const room = `game:${gameId}`;
      this.io.to(room).emit('game:over', {
        result: moveResult.result,
        by: moveResult.by,
        winner: moveResult.winner,
        ratingChanges: ratingResult
      });

      // Auto-queue Stockfish analysis
      queueGameAnalysis(gameId).catch(err => logger.error('Auto-analysis failed', err.message));

      gameEngine.activeGames.delete(gameId);
    } catch (err) {
      logger.error('Finalize game error', err.message);
    }
  }

  async handleResign(socket, data) {
    const { gameId } = data;
    const gameData = gameEngine.activeGames.get(gameId);
    if (!gameData) return;

    const color = gameEngine.getPlayerColor(gameData, socket.user._id.toString());
    if (!color) return;

    const chess = gameData.chess;
    const result = gameEngine.resign(chess, color);

    const game = await Game.findById(gameId);
    game.status = 'completed';
    game.result = result.result;
    game.termination = result.by;
    game.fen = chess.fen();
    game.pgn = chess.pgn();
    game.moves = gameData.moveHistory;
    game.clocks = gameData.clocks;
    game.completedAt = new Date();
    await game.save();

    const ratingResult = await gameEngine.processRating(game, result.winner);
    const room = `game:${gameId}`;
    this.io.to(room).emit('game:over', {
      result: result.result,
      by: result.by,
      winner: result.winner,
      ratingChanges: ratingResult
    });

    // Auto-queue Stockfish analysis
    queueGameAnalysis(gameId).catch(err => logger.error('Auto-analysis failed', err.message));

    gameEngine.activeGames.delete(gameId);
  }

  handleDrawOffer(socket, data) {
    const { gameId } = data;
    const gameData = gameEngine.activeGames.get(gameId);
    if (!gameData) return;

    if (gameData.drawOfferedBy === socket.user._id.toString()) return;

    gameData.drawOfferedBy = socket.user._id.toString();
    this.io.to(`game:${gameId}`).emit('game:draw-offered', {
      by: socket.user._id.toString(),
      byName: socket.user.name
    });
  }

  async handleDrawResponse(socket, data) {
    const { gameId, accepted } = data;
    const gameData = gameEngine.activeGames.get(gameId);
    if (!gameData) return;

    // Validate only the non-offering player can respond
    if (gameData.drawOfferedBy === socket.user._id.toString()) return;

    if (accepted) {
      const chess = gameData.chess;
      const result = { winner: null, by: 'agreement', result: '0.5-0.5' };
      await this._finalizeGame(gameId, result);
    } else {
      gameData.drawOfferedBy = null;
      this.io.to(`game:${gameId}`).emit('game:draw-declined');
    }
  }

  async handleAbort(socket, data) {
    const { gameId } = data;
    const game = await Game.findById(gameId);
    if (!game) return;
    if (game.moves && game.moves.length > 0) return socket.emit('game:error', { message: 'Cannot abort after moves made' });

    game.status = 'aborted';
    game.result = '*';
    game.termination = 'aborted';
    game.completedAt = new Date();
    await game.save();

    gameEngine.activeGames.delete(gameId);
    this.io.to(`game:${gameId}`).emit('game:aborted');
  }

  async handleRematch(socket, data) {
    const { gameId } = data;
    const oldGame = await Game.findById(gameId);
    if (!oldGame) return;

    const timeControl = oldGame.timeControl;
    const gameId2 = new (require('mongoose').Types.ObjectId)();
    const dbGame = await Game.create({
      _id: gameId2,
      players: [
        { user: oldGame.players[1].user, color: 'white' },
        { user: oldGame.players[0].user, color: 'black' }
      ],
      status: 'active',
      timeControl,
      timeControlLabel: oldGame.timeControlLabel,
      clocks: {
        white: timeControl.initial * 60 * 1000,
        black: timeControl.initial * 60 * 1000,
        lastMoveAt: Date.now()
      },
      startedAt: new Date()
    });

    const players = [
      { userId: oldGame.players[1].user.toString(), color: 'white' },
      { userId: oldGame.players[0].user.toString(), color: 'black' }
    ];
    gameEngine.activeGames.set(gameId2.toString(), gameEngine.createGameInstance(gameId2.toString(), undefined, timeControl, players));

    oldGame.players.forEach(p => {
      this.io.to(`user:${p.user}`).emit('match:found', {
        gameId: gameId2.toString(),
        opponent: oldGame.players.find(op => op.user.toString() !== p.user.toString()),
        timeControl,
        timeControlLabel: oldGame.timeControlLabel,
        color: p.user.toString() === oldGame.players[0].user.toString() ? 'black' : 'white'
      });
    });
  }

  async handleSpectateJoin(socket, data) {
    const { gameId } = data;
    if (!gameId) return;

    const gameData = gameEngine.activeGames.get(gameId);
    socket.join(`spectate:${gameId}`);
    socket.join(`game:${gameId}`);

    // Sync full game state to the new spectator
    const syncData = { gameId };
    if (gameData) {
      syncData.fen = gameData.chess.fen();
      syncData.moves = gameData.moveHistory;
      syncData.clocks = gameData.clocks;
      syncData.timeControl = gameData.timeControl;
      syncData.status = gameData.status;
      syncData.turn = gameData.chess.turn();
      syncData.legalMoves = gameData.chess.moves({ verbose: false });
    }

    socket.emit('spectate:synced', syncData);
  }

  handleSpectateLeave(socket, data) {
    const { gameId } = data;
    if (!gameId) return;
    socket.leave(`spectate:${gameId}`);
    socket.leave(`game:${gameId}`);
  }

  handleFriendChallenge(socket, data) {
    const { recipientId, timeControl, rated } = data;
    this.io.to(`user:${recipientId}`).emit('friend:challenged', {
      from: socket.user._id.toString(),
      fromName: socket.user.name,
      timeControl,
      rated
    });
  }

  async handleChallengeResponse(socket, data) {
    const { accept, to, timeControl, rated, category } = data;
    if (!accept) {
      this.io.to(`user:${to}`).emit('friend:challenge-declined', {
        by: socket.user.name
      });
      return;
    }

    const tc = timeControl || { initial: 5, increment: 3 };
    const gameId = new (require('mongoose').Types.ObjectId)();
    const dbGame = await Game.create({
      _id: gameId,
      players: [
        { user: to, color: 'white' },
        { user: socket.user._id, color: 'black' }
      ],
      status: 'active',
      timeControl: tc,
      timeControlLabel: `${tc.initial}+${tc.increment}`,
      rated: rated !== false,
      clocks: {
        white: tc.initial * 60 * 1000,
        black: tc.initial * 60 * 1000,
        lastMoveAt: Date.now()
      },
      startedAt: new Date()
    });

    const players = [
      { userId: to.toString(), color: 'white' },
      { userId: socket.user._id.toString(), color: 'black' }
    ];
    gameEngine.activeGames.set(gameId.toString(), gameEngine.createGameInstance(gameId.toString(), undefined, tc, players));

    [to, socket.user._id.toString()].forEach(uid => {
      this.io.to(`user:${uid}`).emit('match:found', {
        gameId: gameId.toString(),
        opponent: uid === to ? { userId: socket.user._id, username: socket.user.name } : { userId: to },
        timeControl: tc,
        timeControlLabel: `${tc.initial}+${tc.increment}`,
        color: uid === to ? 'white' : 'black'
      });
    });
  }

  handleGameJoin(socket, data) {
    const { gameId } = data || {};
    if (gameId) socket.join(`game:${gameId}`);
  }

  handleGameLeave(socket, data) {
    const { gameId } = data || {};
    if (gameId) socket.leave(`game:${gameId}`);
  }

  handleFollowCoach(socket, data) {
    const { coachId } = data;
    if (!coachId) return;
    socket.join(`coach-followers:${coachId}`);
    logger.info(`${socket.user.name} is now following coach ${coachId}`);
  }

  handleUnfollowCoach(socket, data) {
    const { coachId } = data;
    if (!coachId) return;
    socket.leave(`coach-followers:${coachId}`);
  }

  handleDisconnect(socket) {
    const userId = socket.user?._id?.toString();
    if (userId) {
      matchmaking.leaveQueue(userId);
      this.onlineUsers.delete(userId);
      this.broadcastOnlineUsers();
    }
  }

  broadcastOnlineUsers() {
    const users = Array.from(this.onlineUsers.values()).map(u => ({
      userId: u.userId,
      username: u.username
    }));
    this.io.emit('users:online', { count: users.length, users });
  }

  broadcastQueueSizes() {
    const sizes = matchmaking.getQueueSize();
    this.io.emit('queue:sizes', sizes);
  }

  async createTrainingRoom(socket, data) {
    const { roomName, timeControl } = data;
    const roomId = `training:${new (require('mongoose').Types.ObjectId)()}`;
    socket.join(roomId);
    socket.emit('training:created', { roomId, roomName });
    return roomId;
  }

  joinTrainingRoom(socket, roomId) {
    socket.join(roomId);
    socket.emit('training:joined', { roomId });
  }

  trainingMove(socket, data) {
    const { roomId, fen, move, comment } = data;
    socket.to(roomId).emit('training:move', { fen, move, comment });
  }
}

module.exports = SocketHandler;
