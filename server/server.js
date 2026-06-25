const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

dotenv.config();

const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');

// Patch console to forward through structured logger
const origError = console.error;
const origWarn = console.warn;
console.error = (...args) => { logger.error(args.map(a => typeof a === 'object' ? (a.message || JSON.stringify(a)) : a).join(' ')); };
console.warn = (...args) => { logger.warn(args.map(a => typeof a === 'object' ? (a.message || JSON.stringify(a)) : a).join(' ')); };
const startCronJobs = require('./utils/cronJobs');
const SocketHandler = require('./services/socketHandler');
const { startEventLoopMonitor, stopEventLoopMonitor, startMemoryMonitor, stopMemoryMonitor } = require('./utils/monitor');
validateEnv();

const app = express();
const PORT = process.env.PORT || 5005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Startup logging of critical env vars
console.log('=== ENV STARTUP ===');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'UNDEFINED');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET (' + process.env.JWT_SECRET.length + ' chars)' : 'UNDEFINED');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'UNDEFINED (frontend var, ok if not on server)');
console.log('REACT_APP_SOCKET_URL:', process.env.REACT_APP_SOCKET_URL || 'UNDEFINED (frontend var, ok if not on server)');
console.log('SSL_KEY_PATH:', process.env.SSL_KEY_PATH || 'not set');
console.log('SSL_CERT_PATH:', process.env.SSL_CERT_PATH || 'not set');
console.log('STOCKFISH_THREADS:', process.env.STOCKFISH_THREADS || 'not set');
console.log('AI_COACH_API_KEY:', process.env.AI_COACH_API_KEY ? 'SET' : 'not set');
console.log('ZOOM_API_KEY:', process.env.ZOOM_API_KEY ? 'SET' : 'not set');
console.log('ANALYSIS_QUEUE_BATCH_SIZE:', process.env.ANALYSIS_QUEUE_BATCH_SIZE || 'not set');
console.log('LOG_LEVEL:', process.env.LOG_LEVEL || 'not set');
console.log('ENABLE_ANALYSIS_CRON:', process.env.ENABLE_ANALYSIS_CRON || 'not set');
console.log('================');

const allowedOrigins = CLIENT_URL.split(',').map(s => s.trim());

// Trust proxy for rate limiting behind Render/Railway/Nginx
app.set('trust proxy', 1);

// --- Security & parsing ---
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (NODE_ENV === 'development') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));

// Request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { requestId: req.id });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static files (production) ---
const clientBuild = path.join(__dirname, '..', 'client', 'build');
if (NODE_ENV === 'production' && fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  logger.info('Serving production client build');
}

// --- API routes ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api', require('./routes/courses'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/puzzles', require('./routes/puzzles'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/openings', require('./routes/marketplace'));
app.use('/api/games', require('./routes/games'));

app.get('/', (req, res) => {
  res.json({ message: 'ChessMaster Academy API', version: '1.0.0' });
});

// SPA fallback (production)
if (NODE_ENV === 'production' && fs.existsSync(path.join(clientBuild, 'index.html'))) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.use(require('./middleware/errorHandler'));

// --- HTTP/HTTPS server ---
let server;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

if (NODE_ENV === 'production' && SSL_KEY_PATH && SSL_CERT_PATH) {
  try {
    const sslOptions = {
      key: fs.readFileSync(path.resolve(SSL_KEY_PATH)),
      cert: fs.readFileSync(path.resolve(SSL_CERT_PATH))
    };
    server = https.createServer(sslOptions, app);
    logger.info('HTTPS server configured');
  } catch (err) {
    logger.error('Failed to load SSL certificates, falling back to HTTP', err.message);
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

// --- Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (NODE_ENV === 'development') return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true
  }
});

const socketHandler = new SocketHandler(io);
const { hydrateBalanceCache } = require('./controllers/walletController');
const { setIO } = require('./controllers/tournamentController');
setIO(io);

// --- MongoDB ---
const MONGO_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true
};

mongoose
  .connect(process.env.MONGODB_URI, MONGO_OPTIONS)
  .then(async () => {
    logger.info('MongoDB Connected');
    await hydrateBalanceCache();
    const { warmHealthCache } = require('./controllers/puzzleController');
    warmHealthCache().catch(() => {});
    startCronJobs();
    const { startQueueProcessor } = require('./services/analysisQueueService');
    startQueueProcessor();
    socketHandler.initialize();
    startEventLoopMonitor();
    startMemoryMonitor();
  })
  .catch((err) => {
    logger.error('MongoDB Connection Error', err.message);
    process.exit(1);
  });

// --- Graceful shutdown ---
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — shutting down gracefully`);

  // 1. Stop accepting new work
  stopEventLoopMonitor();
  stopMemoryMonitor();

  // 2. Stop queue processor (await in-progress analysis)
  const { stopQueueProcessor } = require('./services/analysisQueueService');
  await stopQueueProcessor();

  // 3. Stop matchmaking and clock polling
  const matchmaking = require('./services/matchmakingService');
  matchmaking.stop();

  const gameEngine = require('./services/gameEngine');
  gameEngine.stopClockTick();

  // 4. Clear pending Stockfish tasks and terminate workers
  const { quit: quitEngine } = require('./services/stockfishEngine');
  quitEngine();

  // 5. Close Socket.IO
  try { io.close(); } catch {}

  // 6. Disconnect MongoDB
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (err) {
    logger.warn('MongoDB disconnect:', err.message);
  }

  // 7. Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    logger.info('Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('Forced shutdown after timeout');
    process.exit(0);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason instanceof Error ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  if (!shuttingDown) shutdown('UNCAUGHT_EXCEPTION');
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} (${NODE_ENV})`);
});
