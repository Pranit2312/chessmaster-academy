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
const startCronJobs = require('./utils/cronJobs');
const SocketHandler = require('./services/socketHandler');

validateEnv();

const app = express();
const PORT = process.env.PORT || 5005;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const allowedOrigins = CLIENT_URL.split(',').map(s => s.trim());

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
    startCronJobs();
    socketHandler.initialize();
  })
  .catch((err) => {
    logger.error('MongoDB Connection Error', err.message);
    process.exit(1);
  });

// --- Graceful shutdown ---
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} (${NODE_ENV})`);
});
