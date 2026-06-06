# Chess Learning Ecosystem - Security & Scalability Guide

## SECURITY BEST PRACTICES

### 1. Authentication & Authorization

#### JWT Token Management
```javascript
// server/middleware/auth.js - Enhanced
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Token Blacklist to prevent token reuse
const TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

exports.generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '24h' }
  );

  return { accessToken, refreshToken };
};

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await client.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Add token to blacklist
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      await client.setex(`blacklist:${token}`, expiresIn, 'true');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};
```

#### Role-Based Access Control (RBAC)
```javascript
// server/utils/rbac.js
const permissions = {
  student: [
    'browse_courses',
    'purchase_courses',
    'view_enrolled_courses',
    'submit_assignments',
    'view_certificates'
  ],
  coach: [
    'create_courses',
    'edit_own_courses',
    'delete_own_courses',
    'upload_videos',
    'view_analytics',
    'manage_students'
  ],
  admin: [
    'approve_courses',
    'verify_coaches',
    'manage_users',
    'view_revenue',
    'manage_platform_settings'
  ]
};

exports.hasPermission = (role, permission) => {
  return permissions[role]?.includes(permission) || false;
};

// Usage in routes
router.post('/courses/:courseId/publish', 
  authenticate,
  (req, res, next) => {
    if (!exports.hasPermission(req.user.role, 'edit_own_courses')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  },
  courseController.publishCourse
);
```

### 2. Data Protection

#### Password Security
```javascript
// server/models/User.js - Password hashing
const bcrypt = require('bcryptjs');

userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  try {
    // Generate salt (10 rounds = ~100ms)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.isPasswordExpired = function() {
  const passwordAge = Date.now() - this.passwordChangedAt;
  const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
  return passwordAge > maxAge;
};
```

#### Sensitive Data Encryption
```javascript
// server/utils/encryption.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

module.exports = new EncryptionService();
```

### 3. Input Validation & Sanitization

#### Input Validation with Joi
```javascript
// server/utils/schemas.js
const Joi = require('joi');

exports.courseSchema = Joi.object({
  title: Joi.string().min(5).max(150).required(),
  description: Joi.string().min(50).max(5000).required(),
  category: Joi.string().valid(
    'Openings', 'Endgame', 'Tactics', 'Strategy', 'Middle Game'
  ).required(),
  pricing: Joi.object({
    isFree: Joi.boolean().required(),
    price: Joi.number().min(0).when('isFree', {
      is: false,
      then: Joi.required()
    }),
    discountPercentage: Joi.number().min(0).max(100)
  }),
  objectives: Joi.array().items(Joi.string().max(200))
});

exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        errors: messages
      });
    }

    req.body = value;
    next();
  };
};
```

#### XSS Prevention
```javascript
// server/middleware/xssPrevention.js
const xss = require('xss');

exports.sanitizeInputs = (req, res, next) => {
  // Sanitize request body
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = xss(req.body[key]);
    }
  }

  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = xss(req.query[key]);
    }
  }

  next();
};

// Apply to all routes
app.use(exports.sanitizeInputs);
```

#### SQL Injection Prevention (MongoDB)
```javascript
// MongoDB automatically prevents injection with Mongoose
// But validate input types explicitly

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    validate: {
      validator: function(v) {
        // Prevent code injection patterns
        return !/[<>{}[\]\/\\]/g.test(v);
      },
      message: 'Invalid characters in title'
    }
  }
});
```

### 4. API Security

#### Rate Limiting
```javascript
// server/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin' // Skip rate limit for admins
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  skipSuccessfulRequests: true
});

const enrollmentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.user.id}:enrollment`
});

module.exports = {
  generalLimiter,
  loginLimiter,
  enrollmentLimiter
};

// Usage
app.use('/api/', generalLimiter);
app.post('/api/auth/login', loginLimiter, authController.login);
app.post('/api/enrollments', enrollmentLimiter, enrollmentController.enrollInCourse);
```

#### CORS Configuration
```javascript
// server/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: function(origin, callback) {
    const whitelist = process.env.CORS_WHITELIST.split(',');
    
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
```

#### CSRF Protection
```javascript
// server/middleware/csrf.js
const csrf = require('csrf');

const csrfProtection = csrf({ cookie: false });

// Middleware
exports.generateCsrfToken = (req, res, next) => {
  const token = csrfProtection.create(req.sessionID);
  res.cookie('_csrf', token, { httpOnly: true, secure: true, sameSite: 'strict' });
  req.csrfToken = token;
  next();
};

exports.validateCsrfToken = csrfProtection.middleware();
```

### 5. Payment Security

#### PCI DSS Compliance
```javascript
// server/utils/paymentSecurity.js
// Never store credit card details - use Razorpay tokens only

exports.createPaymentOrder = async (amount, receipt) => {
  // Razorpay handles PCI compliance
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes: {} // Do NOT include sensitive data
  });

  return order;
};

exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(orderId + '|' + paymentId);
  const digest = shasum.digest('hex');

  return digest === signature;
};

// Never log payment details
exports.logPayment = (payment) => {
  // Log only masked data
  return {
    orderId: payment.orderId,
    amount: payment.amount,
    status: payment.status,
    timestamp: payment.timestamp
    // Do NOT log paymentId, signature, or any card data
  };
};
```

### 6. File Upload Security

#### File Validation
```javascript
// server/middleware/fileValidation.js
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_PGN_TYPES = ['text/plain', 'application/octet-stream'];

const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_PGN_SIZE = 10 * 1024 * 1024; // 10MB

exports.validateVideoUpload = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided'
    });
  }

  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `Invalid video format. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`
    });
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024 / 1024}GB`
    });
  }

  // Scan for viruses (integrate with ClamAV or VirusTotal)
  // TODO: Implement virus scanning

  next();
};

// Similar validators for PDF and PGN files
```

---

## SCALABILITY ARCHITECTURE

### 1. Database Optimization

#### Indexing Strategy
```javascript
// server/models/Course.js - Comprehensive indexing

courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ 'pricing.isFree': 1 });
courseSchema.index({ averageRating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });

// Compound indexes for common queries
courseSchema.index({ status: 1, isPublished: 1 });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ instructor: 1, status: 1 });

// Text index for search
courseSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// TTL Index for temporary data
courseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
```

#### Connection Pooling
```javascript
// server/db/mongodb.js
const mongoose = require('mongoose');

const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  family: 4
};

mongoose.connect(process.env.MONGODB_CONNECTION_STRING, options);

module.exports = mongoose;
```

#### Query Optimization
```javascript
// server/services/courseService.js
const Course = require('../models/Course');

exports.getPopularCourses = async (limit = 10) => {
  return Course.find({ isPublished: true })
    .select('title thumbnail category averageRating enrollmentCount')
    .sort({ enrollmentCount: -1, averageRating: -1 })
    .limit(limit)
    .lean() // Returns plain objects, not Mongoose documents
    .cache(300); // Cache for 5 minutes
};

// Pagination best practices
exports.getCoursesPaginated = async (page = 1, limit = 12, filters = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Course.find(filters)
      .select('title thumbnail category averageRating enrollmentCount')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Course.countDocuments(filters)
  ]);

  return {
    data,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      hasNextPage: pageNum * limitNum < total
    }
  };
};
```

### 2. Caching Strategy

#### Redis Caching
```javascript
// server/services/cacheService.js
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

class CacheService {
  async get(key) {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key) {
    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

module.exports = new CacheService();

// Usage in controllers
exports.getCourses = async (req, res) => {
  const cacheKey = `courses:${JSON.stringify(req.query)}`;
  
  // Check cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  // Get from database
  const data = await Course.find(query);

  // Cache result
  await cacheService.set(cacheKey, data, 300); // 5 minutes

  res.status(200).json({
    success: true,
    data
  });
};
```

### 3. Load Balancing

#### Multiple Server Instances
```javascript
// server/loadBalancer.js
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  // Worker process
  const app = require('./server');
  const PORT = process.env.PORT || 5005;
  
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}
```

### 4. Asynchronous Processing

#### Job Queue with Bull
```javascript
// server/services/jobQueue.js
const Queue = require('bull');
const redis = require('redis');

const videoProcessingQueue = new Queue('video-processing', process.env.REDIS_URL);
const emailQueue = new Queue('emails', process.env.REDIS_URL);
const analyticsQueue = new Queue('analytics', process.env.REDIS_URL);

// Video processing
videoProcessingQueue.process(async (job) => {
  const { videoId, quality } = job.data;
  
  console.log(`Processing video ${videoId} at ${quality}`);
  
  // Long-running video conversion
  await convertVideoToHLS(videoId, quality);
  
  return { success: true, videoId };
});

// Email sending
emailQueue.process(5, async (job) => { // Process 5 emails concurrently
  const { to, subject, body } = job.data;
  
  await sendEmail(to, subject, body);
});

// Analytics processing
analyticsQueue.process(async (job) => {
  const { enrollmentId, eventData } = job.data;
  
  await updateAnalytics(enrollmentId, eventData);
});

// Usage in controllers
exports.uploadVideo = async (req, res) => {
  const { videoFile, lessonId } = req.body;

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(videoFile.path, {
    resource_type: 'video'
  });

  // Add job to queue for processing
  await videoProcessingQueue.add({
    videoId: result.public_id,
    quality: ['720p', '1080p']
  });

  res.status(202).json({
    success: true,
    message: 'Video uploaded. Processing started.',
    videoId: result.public_id
  });
};

module.exports = {
  videoProcessingQueue,
  emailQueue,
  analyticsQueue
};
```

### 5. API Response Optimization

#### Response Compression
```javascript
// server/middleware/compression.js
const compression = require('compression');

// Compress responses larger than 1KB
app.use(compression({
  threshold: 1024,
  level: 6 // Balance between compression ratio and speed
}));
```

#### Pagination & Cursor-Based Navigation
```javascript
// server/services/paginationService.js
exports.getCursorPaginated = async (Model, query, cursor, limit = 20) => {
  let filterQuery = { ...query };

  if (cursor) {
    filterQuery._id = { $gt: cursor };
  }

  const data = await Model.find(filterQuery)
    .limit(limit + 1)
    .lean();

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? results[results.length - 1]._id : null;

  return {
    data: results,
    pagination: {
      nextCursor,
      hasMore
    }
  };
};
```

### 6. Monitoring & Performance

#### Health Checks & Metrics
```javascript
// server/middleware/metrics.js
const promClient = require('prom-client');

// Default metrics
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries',
  labelNames: ['operation', 'collection'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

// Middleware for request metrics
exports.metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);
  });

  next();
};

// Prometheus endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

---

This comprehensive guide provides production-ready security and scalability implementation for the Chess Learning Ecosystem.
