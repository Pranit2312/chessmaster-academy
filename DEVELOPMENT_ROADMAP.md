# Chess Learning Ecosystem - Development Roadmap & Deployment Guide

## PHASE 1: FOUNDATION (Weeks 1-3)

### Week 1: Setup & Database Infrastructure

#### Day 1-2: Environment Setup
```bash
# Install dependencies
cd server
npm install cloudinary express-multer-cloudinary joi axios
npm install -D @types/node

# Add to .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
MONGODB_ATLAS_CONNECTION_STRING=mongodb+srv://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

#### Day 3-4: Database Migration
```javascript
// server/utils/migrate.js
const mongoose = require('mongoose');

const migrations = [
  // Migration 1: Add course-related fields to User model
  {
    name: 'add_instructor_fields',
    up: async (db) => {
      await db.collection('users').updateMany(
        { role: 'coach' },
        { $set: { 
          instructorVerified: false,
          verificationDocument: null,
          coursesCreated: 0,
          courseEarnings: 0
        }}
      );
    }
  },
  
  // Migration 2: Create indexes for courses
  {
    name: 'create_course_indexes',
    up: async (db) => {
      const coursesCol = db.collection('courses');
      await coursesCol.createIndex({ slug: 1 }, { unique: true });
      await coursesCol.createIndex({ instructor: 1 });
      await coursesCol.createIndex({ status: 1 });
      await coursesCol.createIndex({ 'pricing.isFree': 1 });
    }
  }
];

async function runMigrations() {
  const db = mongoose.connection.db;
  for (const migration of migrations) {
    console.log(`Running migration: ${migration.name}`);
    await migration.up(db);
  }
  console.log('All migrations completed');
}

// Run with: node server/utils/migrate.js
```

#### Day 5: Database Schema Validation
```javascript
// server/utils/validateSchemas.js
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

async function validateSchemas() {
  try {
    // Test Course creation
    const testCourse = new Course({
      title: 'Test Course',
      description: 'Test Description',
      category: 'Openings',
      instructor: 'test-id',
      pricing: { isFree: true }
    });
    
    const validated = await testCourse.validate();
    console.log('✅ Course schema validated');
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
  }
}
```

### Week 2: Backend Core Features

#### Day 1-2: File Upload Service (Cloudinary Integration)
```javascript
// server/utils/cloudinaryService.js
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

class CloudinaryService {
  async uploadVideo(buffer, fileName) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          public_id: `courses/videos/${fileName}`,
          quality: 'auto',
          fetch_format: 'mp4',
          transformation: [
            { width: 1920, height: 1080, crop: 'fill' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  async uploadPDF(buffer, fileName) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: `courses/pdfs/${fileName}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  async deleteResource(publicId) {
    return cloudinary.uploader.destroy(publicId);
  }
}

module.exports = new CloudinaryService();
```

#### Day 3-4: Media Upload Routes
```javascript
// server/routes/media.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const CloudinaryService = require('../utils/cloudinaryService');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB for videos
});

router.post(
  '/upload-video',
  authenticate,
  authorize('coach'),
  upload.single('video'),
  async (req, res) => {
    try {
      const { lessonId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadVideo(
        file.buffer,
        `${lessonId}-${Date.now()}`
      );

      res.status(200).json({
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          duration: result.duration
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

module.exports = router;
```

#### Day 5: Authentication Extension for Coaches
```javascript
// server/controllers/authController.js (additions)

exports.registerCoach = async (req, res) => {
  try {
    const { name, email, password, chessRating, ratingType, experience, specializations, hourlyRate, title } = req.body;

    // Existing validation code...

    const user = new User({
      name,
      email,
      password,
      role: 'coach',
      chessRating,
      ratingType,
      experience,
      specializations,
      hourlyRate,
      title,
      instructorVerified: false // Pending verification
    });

    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user.email, user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};
```

### Week 3: Testing & Optimization

#### Day 1-2: Unit Tests
```javascript
// server/__tests__/courseController.test.js
const request = require('supertest');
const app = require('../server');
const Course = require('../models/Course');
const User = require('../models/User');

describe('Course Controller', () => {
  let coachToken;
  let coachId;

  beforeAll(async () => {
    // Create test coach
    const coach = await User.create({
      name: 'Test Coach',
      email: 'coach@test.com',
      password: 'password123',
      role: 'coach',
      chessRating: 2000
    });
    coachId = coach._id;
    coachToken = generateToken(coach._id);
  });

  test('Should create a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        title: 'Opening Mastery',
        description: 'Learn the top openings',
        category: 'Openings',
        pricing: { isFree: false, price: 99 }
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Opening Mastery');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
  });
});
```

#### Day 3-4: Integration Testing
```bash
# Create test suite for enrollment flow
npm install jest supertest

# Add to package.json scripts
"test": "jest --coverage",
"test:watch": "jest --watch"
```

#### Day 5: Performance Profiling
```javascript
// server/utils/performanceMonitor.js
const os = require('os');

class PerformanceMonitor {
  static logMetrics() {
    setInterval(() => {
      const cpuUsage = os.loadavg();
      const memUsage = process.memoryUsage();
      
      console.log('📊 Performance Metrics:');
      console.log(`CPU: ${(cpuUsage[0] * 100).toFixed(2)}%`);
      console.log(`Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`---`);
    }, 60000); // Every minute
  }
}

module.exports = PerformanceMonitor;
```

---

## PHASE 2: CORE COURSE FEATURES (Weeks 4-6)

### Week 4: Course Management APIs

**Tasks:**
- ✅ Implement chapter CRUD operations
- ✅ Implement lesson CRUD operations
- ✅ Add course status workflow (draft → submitted → published)
- ✅ Implement video storage and streaming with HLS

**Sample Implementation:**
```javascript
// Configure HLS streaming for Cloudinary
const hlsTransformation = {
  resource_type: 'video',
  quality: 'auto',
  fetch_format: 'mp4',
  transformation: [
    { quality: 'auto' },
    { fetch_format: 'm3u8' } // For HLS streaming
  ]
};
```

### Week 5: Progress Tracking & Analytics

**Tasks:**
- ✅ Create progress tracking system
- ✅ Implement quiz/assessment scoring
- ✅ Add lesson completion tracking
- ✅ Create enrollment analytics dashboard

### Week 6: Certificates & Gamification

**Tasks:**
- ✅ Implement certificate generation
- ✅ Add certificate verification system
- ✅ Create achievement badges
- ✅ Implement progress notifications

---

## PHASE 3: FRONTEND IMPLEMENTATION (Weeks 7-9)

### Course Marketplace Components
```javascript
// client/src/components/CourseMarketplace.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CourseCard from './CourseCard';
import CourseFilters from './CourseFilters';

const CourseMarketplace = () => {
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    priceRange: [0, 1000],
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12 });

  useEffect(() => {
    fetchCourses();
  }, [filters, pagination]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses', {
        params: {
          ...filters,
          ...pagination
        }
      });
      setCourses(response.data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  return (
    <div className="marketplace-container">
      <div className="sidebar">
        <CourseFilters onFilterChange={setFilters} />
      </div>
      <div className="main-content">
        <div className="courses-grid">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseMarketplace;
```

### Video Player Component
```javascript
// client/src/components/VideoPlayer.js
import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player/hls';

const VideoPlayer = ({ videoUrl, lessonTitle, duration }) => {
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(0);
  const playerRef = useRef(null);

  const handleProgress = (state) => {
    setWatched(state.played * 100);
    
    // Auto-save progress every 10%
    if (watched % 10 === 0) {
      saveProgress();
    }
  };

  const saveProgress = async () => {
    try {
      await axios.post(`/api/progress/${lessonId}/update`, {
        watchedDuration: playerRef.current.getCurrentTime()
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return (
    <div className="video-player">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        controls
        width="100%"
        height="100%"
        onProgress={handleProgress}
        onEnded={() => setWatched(100)}
      />
      <div className="progress-bar">
        <span>{watched.toFixed(0)}% watched</span>
      </div>
    </div>
  );
};

export default VideoPlayer;
```

### Course Creator Wizard
```javascript
// client/src/components/CourseCreatorWizard.js
import React, { useState } from 'react';
import StepIndicator from './StepIndicator';
import BasicInfo from './steps/BasicInfo';
import Curriculum from './steps/Curriculum';
import Pricing from './steps/Pricing';
import Media from './steps/Media';
import Review from './steps/Review';

const CourseCreatorWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    chapters: []
  });

  const steps = [
    { number: 1, title: 'Basic Information', component: BasicInfo },
    { number: 2, title: 'Curriculum', component: Curriculum },
    { number: 3, title: 'Media', component: Media },
    { number: 4, title: 'Pricing', component: Pricing },
    { number: 5, title: 'Review', component: Review }
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="wizard-container">
      <StepIndicator currentStep={currentStep} steps={steps} />
      <CurrentStepComponent 
        data={courseData}
        onChange={setCourseData}
      />
      <div className="wizard-controls">
        <button onClick={handlePrevious} disabled={currentStep === 1}>
          Previous
        </button>
        <button onClick={handleNext} disabled={currentStep === steps.length}>
          Next
        </button>
        {currentStep === steps.length && (
          <button onClick={handleSubmit} className="primary">
            Publish Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCreatorWizard;
```

---

## PHASE 4: ADVANCED FEATURES (Weeks 10-12)

### Chess Opening Library
```javascript
// server/controllers/openingController.js
const OpeningLibrary = require('../models/OpeningLibrary');
const Stockfish = require('stockfish');

exports.searchOpenings = async (req, res) => {
  try {
    const { query, complexity, ecoCode } = req.query;

    let filter = {};
    if (query) filter.name = { $regex: query, $options: 'i' };
    if (complexity) filter.complexity = complexity;
    if (ecoCode) filter.ecoCode = ecoCode;

    const openings = await OpeningLibrary.find(filter)
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: openings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching openings',
      error: error.message
    });
  }
};

exports.analyzeOpening = async (req, res) => {
  try {
    const { moves } = req.body;
    
    // Analyze opening with Stockfish
    const analysis = await analyzeWithStockfish(moves);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error analyzing opening',
      error: error.message
    });
  }
};

async function analyzeWithStockfish(moves) {
  // Implementation for Stockfish analysis
  // Returns: { evaluation, bestMove, variations }
}
```

### Tournament System
```javascript
// server/controllers/tournamentController.js
const Tournament = require('../models/Tournament');

exports.createTournament = async (req, res) => {
  try {
    const { name, tournamentType, timeControl, maxParticipants, startDate, endDate } = req.body;

    const tournament = new Tournament({
      name,
      tournamentType,
      timeControl,
      maxParticipants,
      startDate,
      endDate,
      organizer: req.user.id
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating tournament',
      error: error.message
    });
  }
};

exports.registerForTournament = async (req, res) => {
  try {
    const { tournamentId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.registeredCount >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    tournament.participants.push({
      userId: req.user.id,
      registeredAt: new Date()
    });

    tournament.registeredCount += 1;
    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for tournament'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering for tournament',
      error: error.message
    });
  }
};
```

### Discussion Forum
```javascript
// server/routes/forum.js
const express = require('express');
const router = express.Router();
const { Discussion, ForumReply } = require('../models/Forum');
const { authenticate } = require('../middleware/auth');

router.post('/discussions', authenticate, async (req, res) => {
  try {
    const { title, content, category, course, lesson, tags } = req.body;

    const discussion = new Discussion({
      title,
      content,
      category,
      course,
      lesson,
      tags,
      author: req.user.id
    });

    await discussion.save();

    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating discussion',
      error: error.message
    });
  }
});

router.post('/discussions/:discussionId/replies', authenticate, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    const reply = new ForumReply({
      content,
      discussion: discussionId,
      author: req.user.id
    });

    await reply.save();

    // Update discussion reply count
    await Discussion.findByIdAndUpdate(
      discussionId,
      { $inc: { repliesCount: 1 } }
    );

    res.status(201).json({
      success: true,
      data: reply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating reply',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## PHASE 5: OPTIMIZATION & LAUNCH (Weeks 13-14)

### Performance Optimization Checklist

- [ ] Database Query Optimization
  - [ ] Add composite indexes
  - [ ] Implement query pagination
  - [ ] Cache frequently accessed data with Redis

- [ ] Frontend Optimization
  - [ ] Code splitting with React.lazy()
  - [ ] Image optimization with next-image
  - [ ] Minification and bundling

- [ ] API Optimization
  - [ ] Response compression (gzip)
  - [ ] Rate limiting implementation
  - [ ] API response caching

### Load Testing
```javascript
// Load test with Apache JMeter or Artillery
// artillery.yml
config:
  target: 'http://localhost:5005'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Ramp up'
    - duration: 60
      arrivalRate: 200
      name: 'Stress'

scenarios:
  - name: 'Browse Courses'
    flow:
      - get:
          url: '/api/courses?page=1&limit=12'
      - think: 5
      - post:
          url: '/api/enrollments'
          json:
            courseId: '{{ courseId }}'
```

---

## PRODUCTION DEPLOYMENT GUIDE

### Environment Setup

```bash
# AWS EC2 Instance Setup
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm mongodb git nginx -y

# Clone repository
git clone <repository-url>
cd coaching
npm install

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com
```

### Docker Deployment
```dockerfile
# Dockerfile for server
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY server ./server

EXPOSE 5005

CMD ["node", "server/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  server:
    build: .
    ports:
      - "5005:5005"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/chess-coaching
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs

volumes:
  mongo_data:
```

### Nginx Configuration
```nginx
# nginx.conf
upstream backend {
  server server:5005;
  keepalive 32;
}

upstream client {
  server client:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;
  
  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com www.yourdomain.com;

  ssl_certificate /etc/nginx/certs/yourdomain.com.crt;
  ssl_certificate_key /etc/nginx/certs/yourdomain.com.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/json application/javascript;

  # Backend API
  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Frontend
  location / {
    proxy_pass http://client;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
  }

  # Cache static files
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh -i ~/.ssh/deploy_key $DEPLOY_HOST 'cd /app && git pull && npm install && npm run build && pm2 restart coaching'
```

### Monitoring & Logging
```javascript
// server/middleware/logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;
```

### Health Checks
```javascript
// server/routes/health.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('redis');

router.get('/health', async (req, res) => {
  try {
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'ok' : 'error';
    
    // Check Redis
    const redisStatus = 'ok'; // Implement redis client check
    
    // Check Server
    const serverStatus = 'ok';

    const allHealthy = mongoStatus === 'ok' && redisStatus === 'ok' && serverStatus === 'ok';

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
        server: serverStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/chess-coaching"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/chess-coaching-$TIMESTAMP.tar.gz"

# Backup MongoDB
mongodump --out /tmp/mongodb-backup

# Create compressed archive
tar -czf $BACKUP_FILE /tmp/mongodb-backup

# Upload to S3
aws s3 cp $BACKUP_FILE s3://chess-coaching-backups/

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

---

This comprehensive roadmap provides a complete path from foundation to production deployment with enterprise-grade practices.
