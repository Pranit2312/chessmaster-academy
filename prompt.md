# CHESSMASTER ACADEMY — PHASE 3 ENTERPRISE EXPANSION

You are a Senior Software Architect, MERN Stack Engineer, and Database Designer.

---

## CRITICAL: READ THIS FIRST

This project is an **ACTIVE production-style MERN application**. Before writing a single line of code, you **MUST** read and understand the architecture audit below. Do not guess, do not replace, do not refactor working features. **Only extend.**

---

## COMPLETE ARCHITECTURE AUDIT

### Folder Structure
```
server/
├── config/          (commission rates, constants)
├── controllers/     (auth, wallet, walletEnhanced, payment, paymentEnhanced, booking, slot, user, course, courseEnhanced, enrollment, enrollmentEnhanced, analysis, puzzle, puzzleRush, review, chapterLesson, coachPuzzle, aiBot, aiPuzzle, aiOpening, aiChat, aiInsights)
├── engines/         (stockfish binary)
├── jobs/            (analysis queue)
├── middleware/      (auth.js → protect + restrictTo, authorization.js → coachOnly/studentOnly/adminOnly/checkOwnership, errorHandler, asyncHandler, rateLimiter, validation)
├── models/          (25 files: User, Wallet, Transaction, Withdrawal, Booking, Slot, Course, Enrollment, Progress, Puzzle, AiPuzzle, Chapter, Lesson, Review, Analysis, AiChat, AiInsight, BotGame, Certificate, CoachPuzzle, Forum Discussion+Reply, OpeningLibrary, PuzzleProfile, PuzzleRush, Tournament)
├── routes/          (auth, users, slots, bookings, payments, reviews, wallet, admin, sessions, courses, analysis, ai, puzzles)
├── scripts/         (puzzle importers, finalVerify)
├── services/        (puzzleApiService, puzzleEngine, sessionManagement, stockfishService)
├── utils/           (cronJobs, dailyClassCreation, errorCodes, logger)
└── server.js        (entry point)

client/src/
├── components/      (analysis/, dashboard/, puzzles/, Navbar, LoadingSpinner)
├── context/         (AuthContext)
├── hooks/           (custom hooks)
├── pages/           (all route pages)
├── styles/          (CSS)
└── utils/           (api.js — axios instance with auth interceptor)
```

### MongoDB Models (Key)

| Collection | Key Fields | Key Details |
|---|---|---|
| `users` | name, email, password, role (student/coach/admin), chessRating, ratingType, specializations, title, hourlyRate, isActive | `pre('save')` bcrypt hashing; `comparePassword()` method |
| `wallets` | user (ref), balance, escrowBalance, pendingWithdrawal, currency (INR) | timestamps |
| `transactions` | user, amount, type (credit/debit), reason (wallet_topup/booking_payment/booking_refund/coach_earning/withdrawal), bookingId, razorpayOrderId, razorpayPaymentId | compound index on user+razorpayPaymentId |
| `withdrawals` | coach (ref), amount, status (pending/approved/rejected) | |
| `bookings` | student, coach, slot, amount, commission (10%), coachEarning (90%), paymentStatus, razorpay*, meetingLink, sessionStatus | |
| `slots` | coach, startTime, endTime, duration (60), price, meetingLink, meetingPlatform, isBooked, bookingId, status | indexes: coach+startTime, status+startTime |
| `courses` | title, slug (unique), description, instructor (ref), pricing {isFree, price, effectivePrice}, category, difficulty, status (draft/submitted/approved/published/rejected/archived), chapters, enrollmentCount, averageRating | 6 indexes |
| `enrollments` | student, course, enrollmentStatus, pricePaid, progressPercentage, lessonsCompleted | unique compound: student+course |
| `progress` | student, enrollment, course, lesson, chapter, status, watchedDuration, completionPercentage, quizAttempts | |
| `puzzles` | puzzleId (unique), fen, solution[String], rating, themes, openingTags, source (lichess/chesscom/coach/generated) | 5 compound indexes |
| `puzzleprofiles` | user (unique), puzzleRating (1200), solvedCount, correctCount, streak, themeStats, weakThemes, strongThemes | `recordSolve()` method |
| `puzzlerushes` | user, mode (3min/5min/survival), score, puzzles[{puzzle, correct, move}], status | |
| `coachpuzzles` | coach, fen, solution, difficulty, theme, likeCount, saveCount | |
| `chapters` | title, course (ref), orderIndex, lessons[ref], totalLessons | |
| `lessons` | title, contentType (video/text/quiz/assignment/mixed), chapter, course, orderIndex, video, quiz, isPreview, isPublished | |
| `stockfishanalyses` | gameId, user, pgn, depth (10-50), engine, moves[{eval}], summary, status (queued/analyzing/completed/failed) | |
| `aichats` | user, title, messages[{role, content}], context (general/game_analysis/opening_advice/tactics/endgame/strategy/course_help) | |
| `aiinsights` | user, type (weakness/strength/recommendation), category, title, severity, metric, value, trend | |
| `botgames` | user, fen, pgn, moves, result, difficulty (1-20), playerColor, timeControl, analysis | |
| `certificates` | student, course, instructor, certificateNumber (unique), verificationCode (unique, 6-digit), status (issued/verified/revoked) | |
| `openinglibraries` | name, ecoCode (unique), description, moveSequence, openingType, variations, strategicIdeas, statistics{whiteWin%, draw%, blackWin%} | text index on name |
| `discussions` | title, content, author, category, repliesCount, viewCount, likesCount, isPinned, isClosed | text index on title+content |
| `forumreplies` | content, discussion (ref), author, parentReply, isMarkedAsSolution | |
| `tournaments` | **EXISTS but empty/unused**: name, description, organizer, tournamentType (Round Robin/Swiss/Knockout/Ladder), timeControl, maxParticipants, minRating, maxRating, registeredCount, startDate, endDate, registrationDeadline, rounds, standings, prizes, status | indexes: organizer, status, startDate |
| `coachpuzzles` | coach, fen, solution, explanation, difficulty, theme, likeCount, saveCount | |

### All API Routes (100+ endpoints)

**Auth** (`/api/auth`): POST /register, POST /login, GET /me
**Users** (`/api/users`): GET /coaches, GET /coach/:id, GET /profile/:id, PUT /profile, PUT /change-password
**Wallet** (`/api/wallet`): GET /me, GET /, GET /transactions, POST /add-money, POST /add-funds, POST /create-topup-order, POST /verify-topup, GET /earnings (coach), POST /withdraw (coach), POST /request-withdrawal (coach), POST /reset
**Payments** (`/api/payments`): POST /create-order (student), POST /verify (student), POST /verify-signature, GET /:bookingId
**Bookings** (`/api/bookings`): GET /my-bookings (student), GET /coach-bookings (coach), GET /:id, PUT /:id/status, PUT /:id/cancel, PUT /:id/notes, POST / (student)
**Slots** (`/api/slots`): GET /predefined/list, GET /daily/:date (coach), POST /daily/create (coach), POST /daily/bulk (coach), POST /daily/custom (coach), DELETE /daily/:date (coach), POST /, GET /, GET /my-slots (coach), PUT /:id (coach), DELETE /:id (coach)
**Courses** (`/api` prefix): Full CRUD for courses, chapters, lessons, enrollments, progress, certificates (40+ endpoints)
**Sessions** (`/api/sessions`): POST /book (student), GET /my-sessions, GET /upcoming, GET /:sessionId, PUT /:sessionId/status (coach), PUT /:sessionId/complete (coach), PUT /:sessionId/cancel, GET /coach/:coachId/all, GET /coach/:coachId/stats, POST /:sessionId/generate-zoom (coach), GET /:sessionId/zoom-details
**Reviews** (`/api/reviews`): POST / (student), GET /coach/:coachId, GET /course/:courseId, GET /my-reviews (student), PUT /:id (student), DELETE /:id (student)
**Admin** (`/api/admin`): GET /transactions, GET /withdrawals — **ONLY 2 endpoints, no approve/reject, no dashboard**
**Analysis** (`/api/analysis`): POST /submit, GET /my-analyses, GET /:analysisId/status, GET /:analysisId, DELETE /:analysisId
**AI** (`/api/ai`): Engine status, bot games (start/move/get/resign/analyze), AI puzzles (daily/list/stats/solve/sync/reset), openings (recommend/explore/search/user-stats/seed), chat (send/history/get/clear), insights (weaknesses/recommendations/progress/assessment/summary/dismiss) — 30+ endpoints
**Puzzles** (`/api/puzzles`): GET /random, GET /daily, GET /theme/:theme, GET /rating/:range, GET /recommended, POST /check, GET /stats, GET /profile, POST /daily/solved, GET /:puzzleId/hint, rush mode (start/next/end/leaderboard/history), coach puzzles CRUD (8 endpoints)

### Middleware

| Middleware | File | Behavior |
|---|---|---|
| `protect` | middleware/auth.js | Extracts Bearer token, verifies JWT, attaches `req.user` (full User doc, no password) |
| `restrictTo(...roles)` | middleware/auth.js | Returns 403 if `req.user.role` not in allowed list |
| `coachOnly` | middleware/authorization.js | Allows ['coach', 'admin'] |
| `studentOnly` | middleware/authorization.js | Allows ['student', 'admin'] |
| `adminOnly` | middleware/authorization.js | Allows ['admin'] |
| `checkOwnership(field)` | middleware/authorization.js | Fetches resource by ID, checks ownership |
| `errorHandler` | middleware/errorHandler.js | Catches all errors, returns `{ success, message, stack (dev only) }` |
| `apiLimiter` | middleware/rateLimiter.js | 100 req / 15 min window |

### Server Entry (`server.js`)
- **Port**: 5000 (env `PORT`)
- **DB**: `mongoose.connect(MONGODB_URI)`
- **Middleware order**: cors → logging → json → urlencoded → routes → errorHandler
- **Route mounts**: 13 routers mounted under /api/*
- **Cron jobs** (started on DB connect, in `utils/cronJobs.js`):
  - Every 60s: auto-complete past-due sessions
  - Every 60s: process Stockfish analysis queue
  - Every 6h: fetch 15 batch + daily puzzle from Lichess API
- **Passport**: NOT used. JWT only.

### Client Routing (`App.js`)

| Path | Component | Access |
|---|---|---|
| `/` | LandingPage | Public |
| `/login` | LoginPage | Public (redirects if logged in) |
| `/register` | RegisterPage | Public (redirects if logged in) |
| `/student/dashboard` | StudentDashboard | student |
| `/browse-coaches`, `/browse` | BrowseCoaches | student |
| `/my-bookings` | MyBookings | student |
| `/my-courses` | MyCoursesPage | student |
| `/coach/dashboard` | CoachDashboard | coach |
| `/coach/bookings` | CoachBookings | coach |
| `/coach/earnings` | CoachEarnings | coach |
| `/create-course` | CreateCoursePage | coach |
| `/coach/puzzles/create` | CoachPuzzleCreator | coach |
| `/wallet` | Wallet | any auth |
| `/courses` | CoursesPage | any auth |
| `/course/:id` | CourseDetailPage | any auth |
| `/course-player/:id` | CoursePlayerPage | any auth |
| `/puzzles` | PuzzlesPage | any auth |
| `/puzzles/rush` | PuzzleRushPage | any auth |
| `/analysis` | GameAnalysisPage | any auth |
| `/analysis/:id` | AnalysisResultPage | any auth |
| `/profile` | ProfilePage | any auth |
| `/coach/:id` | CoachProfile | any auth |
| `/ai/practice` | AiPracticePage | any auth |
| `/ai/puzzles` | AiPuzzlesPage | any auth |
| `/ai/openings` | AiOpeningExplorerPage | any auth |
| `/ai/coach` | AiCoachPage | any auth |
| `/ai/insights` | AiInsightsPage | any auth |
| `*` | Redirect to `/` | catch-all |

### Known Architecture Issues (DO NOT FIX — just be aware)

1. **In-memory wallet balance** (`realBalances` Map in `walletController.js` line 9) — lost on server restart. DB writes `balance` field but never uses it as source of truth.
2. **Duplicate commission logic**: `bookingController.js` uses 10% (coach gets 90%), `paymentControllerEnhanced.js` and `sessionManagement.js` use 20% (coach gets 80%).
3. **Duplicate controller files**: `walletController.js` + `walletControllerEnhanced.js`, `paymentController.js` + `paymentControllerEnhanced.js`, `courseController.js` + `courseControllerEnhanced.js`, `enrollmentController.js` + `enrollmentControllerEnhanced.js` — parallel implementations with different approaches.
4. **Role not in JWT**: Token only contains `{ id }`. Every request re-fetches user from DB.
5. **Stripe installed but unused**: `@stripe/react-stripe-js` and `stripe` are in dependencies with no integration code.
6. **Nodemailer installed but not configured**: No emails are sent.

### Dependencies (Root)
`bcryptjs`, `chess.js`, `cors`, `date-fns`, `dotenv`, `express` ^5.2.1, `express-rate-limit`, `express-validator`, `jsonwebtoken`, `mongoose` ^9.0.1, `node-cron`, `nodemailer`, `razorpay` ^2.9.6, `react-router-dom` ^7.10.1, `react-scripts`, `stockfish` ^18.0.7, `stripe`, `zstd-codec`

### Dependencies (Client)
`axios`, `chess.js`, `date-fns`, `react` ^18.2.0, `react-chessboard` ^4.7.3, `react-dom`, `react-icons`, `react-router-dom` ^6.20.1, `recharts` ^3.8.1, `@craco/craco` (dev)

---

## EXISTING MODULES — MUST NOT BE BROKEN

The following modules are complete and working. **DO NOT TOUCH THEM:**

1. **Authentication** — registration, login, JWT, role check, `getMe`
2. **Wallet** — top-up (Razorpay), balance, transactions, withdrawals (request only)
3. **Payments** — Razorpay order creation, signature verification, booking payments
4. **Bookings** — slot booking, cancel, notes, session status
5. **Slots** — create, list, bulk create, delete, daily slots
6. **Courses** — CRUD, chapters, lessons, enrollment, progress, certificates
7. **Reviews** — create, list, update, delete for coaches and courses
8. **Analysis** — PGN submit, Stockfish analysis, status, results
9. **AI Platform** — bot games, AI puzzles, openings explorer, AI coach chat, AI insights
10. **Puzzle Platform** — random/daily/theme/rating/recommended/check/hint/rush/coach puzzles
11. **User profiles** — get, update, change password, coach listing

---

## GOLDEN RULES

1. **BEFORE WRITING CODE**: Read the audit above. Understand the existing patterns.
2. **DO NOT** remove any existing feature.
3. **DO NOT** modify existing business logic.
4. **DO NOT** refactor working code — even if you see a better pattern.
5. **DO NOT** fix the known architecture issues (in-memory wallet, duplicate commissions, etc.) unless explicitly asked.
6. **ONLY** add new modules via new files (new routes, new controllers, new models, new pages).
7. **Backward compatibility is mandatory** — every existing route must continue to work exactly as before.
8. **Follow existing patterns**: look at how existing controllers/routes/models are structured and match that style.

---

## IMPLEMENTATION PLAN — 13 STEPS IN ORDER

### STEP 1: ADMIN ROLE SYSTEM (Foundation — build FIRST)

The `admin` role already exists in the User model enum. But there is:
- No admin middleware for full CRUD operations
- No admin dashboard UI
- No approve/reject withdrawal endpoint
- No coach verification/approval flow

**What to build:**

#### 1a. Admin Middleware & Permissions
- Create a `server/middleware/permissions.js` that checks admin permissions for specific actions (user management, coach management, course management, payment management, tournament management)
- Keep `restrictTo('admin')` as the base gate; add granular permission checks on top

#### 1b. Admin Routes (`/api/admin`)
Add these endpoints. **Keep existing 2 endpoints untouched** — just add new ones:

```
GET    /api/admin/users              → list all users (paginated, filterable)
PUT    /api/admin/users/:id/ban      → ban user (set isActive=false)
PUT    /api/admin/users/:id/suspend  → suspend user
DELETE /api/admin/users/:id          → hard delete user
PUT    /api/admin/users/:id/restore  → restore banned user

GET    /api/admin/coaches             → list all coaches (paginated)
PUT    /api/admin/coaches/:id/verify  → verify coach (set coach.verified=true)
PUT    /api/admin/coaches/:id/reject  → reject coach
PUT    /api/admin/coaches/:id/feature → feature coach (add isFeatured flag)
DELETE /api/admin/coaches/:id         → remove coach (soft delete)

GET    /api/admin/courses              → list all courses (paginated, filterable by status)
PUT    /api/admin/courses/:id/approve  → approve course (set status=approved, approvedBy, publishedAt)
PUT    /api/admin/courses/:id/reject   → reject course (with reason)
PUT    /api/admin/courses/:id/feature  → feature course
DELETE /api/admin/courses/:id          → hide/remove course

GET    /api/admin/payments             → list all payments/transactions
GET    /api/admin/payments/transactions → raw transactions
GET    /api/admin/withdrawals/pending  → list pending withdrawals
PUT    /api/admin/withdrawals/:id/approve → approve + transfer to coach wallet + create transaction
PUT    /api/admin/withdrawals/:id/reject  → reject + refund to coach wallet

GET    /api/admin/analytics/overview    → totalRevenue, monthlyRevenue, totalStudents, totalCoaches, etc.
GET    /api/admin/analytics/revenue     → revenue chart data (by month)
GET    /api/admin/analytics/growth      → user growth over time
```

#### 1c. Admin Dashboard UI

Create page: `client/src/pages/AdminDashboard.js`
Wire route: `/admin/dashboard` — protected with `requiredRole="admin"`

Sections:
- **Overview cards**: total revenue, total students, total coaches, total courses, total bookings, active tournaments
- **Revenue chart** (use recharts — already in dependencies): monthly revenue bar/line chart
- **User Management tab**: table of all users with search, filter by role, ban/suspend/delete/restore buttons
- **Coach Management tab**: table of coaches with approve/reject/verify/feature buttons
- **Course Management tab**: table of courses with approve/reject/feature/delete buttons
- **Payment Management tab**: transactions table + withdrawals table with approve/reject buttons
- **Tournament Management tab**: list tournaments, create button, start/stop/end actions (placeholder for Step 2)

#### 1d. Add `verified` and `isFeatured` fields to User model
Add to User schema:
- `isVerified: { type: Boolean, default: false }` (for coaches)
- `isFeatured: { type: Boolean, default: false }` (for featured coaches)
- `bannedAt: Date`
- `suspendedUntil: Date`

Add to Course schema (already has approval flow — just ensure admin endpoints work with existing status field):
- Course already has `status: draft/submitted/approved/published/rejected/archived` and `approvedBy` — use these.

#### 1e. Navigation
Add admin nav items when user.role === 'admin':
- Dashboard
- Users
- Coaches
- Courses
- Payments
- Tournaments

---

### STEP 2: TOURNAMENT SYSTEM

#### 2a. Enhance Tournament Model
The `Tournament.js` model exists but needs enhancement for real-money play:

```javascript
// Add/verify these exact fields in server/models/Tournament.js
{
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 5000 },
  banner: { type: String },
  tournamentType: {
    type: String,
    enum: ['swiss', 'round_robin', 'knockout', 'double_elimination', 'arena'],
    required: true
  },
  timeControl: {
    type: {
      initial: { type: Number, required: true },  // minutes
      increment: { type: Number, default: 0 }       // seconds
    },
    required: true
  },
  timeControlLabel: { type: String },  // e.g. "5+3"
  entryFee: { type: Number, default: 0 },  // in INR
  prizePool: { type: Number, default: 0 },
  maxPlayers: { type: Number, min: 2, max: 10000, default: 100 },
  registeredPlayers: [{ type: ObjectId, ref: 'User' }],
  registeredCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: ObjectId, ref: 'User' },
  rules: { type: String, maxlength: 5000 },
  isRated: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: true },
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number },
  pairings: [{
    round: Number,
    matches: [{
      player1: { type: ObjectId, ref: 'User' },
      player2: { type: ObjectId, ref: 'User' },
      result: { type: String, enum: ['1-0', '0-1', '0.5-0.5', '*', null], default: null },
      status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'bye'], default: 'scheduled' }
    }]
  }],
  standings: [{
    player: { type: ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    tieBreak: { type: Number, default: 0 }
  }],
  prizes: [{
    position: { type: Number, required: true },
    amount: { type: Number, required: true },
    winner: { type: ObjectId, ref: 'User', default: null }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### 2b. Tournament Routes (`/api/tournaments`)

```
POST   /api/tournaments                      → admin: create tournament
GET    /api/tournaments                       → list all (public, filterable by status/type)
GET    /api/tournaments/active                → currently active/upcoming tournaments
GET    /api/tournaments/:id                   → tournament details
PUT    /api/tournaments/:id                  → admin: update tournament
DELETE /api/tournaments/:id                  → admin: cancel/delete tournament
POST   /api/tournaments/:id/register         → student: register (with wallet/Razorpay payment)
POST   /api/tournaments/:id/unregister       → student: unregister (before deadline)
POST   /api/tournaments/:id/start            → admin: start tournament (generate pairings)
POST   /api/tournaments/:id/next-round       → admin: generate next round
POST   /api/tournaments/:id/end              → admin: end tournament (distribute prizes)
GET    /api/tournaments/:id/standings        → current standings
GET    /api/tournaments/:id/pairings         → current round pairings
GET    /api/tournaments/:id/leaderboard      → full leaderboard
GET    /api/tournaments/my                   → student: my tournaments
GET    /api/tournaments/stats                → global tournament stats
```

#### 2c. Tournament Registration (Wallet + Razorpay)
- If `entryFee > 0` and user's wallet balance >= entryFee → debit wallet, create TournamentRegistration, increment registeredCount
- If `entryFee > 0` and wallet insufficient → offer Razorpay payment (follow existing pattern in `paymentController.js`)
- On successful payment → mark registration complete

#### 2d. Pairing Engine
Create `server/services/pairingEngine.js` with:

- **`generateSwissPairings(players, currentRound, standings)`** — Swiss system: sort by points, then pair top vs middle, avoid rematches, award bye to lowest if odd count
- **`generateRoundRobinPairings(players, round)`** — Circle method for round-robin
- **`generateKnockoutBracket(players)`** — Seeded single-elimination bracket
- **`generateDoubleEliminationBracket(players)`** — Winners + losers brackets
- **`calculateTieBreak(standings, matches)`** — Buchholz or Median-Buchholz tiebreak

#### 2e. Leaderboard Logic
Create `server/services/leaderboardService.js`:
- Sort by points descending → tieBreak descending
- Update after each round

#### 2f. Prize Distribution
- On tournament end (`PUT /tournaments/:id/end`):
  - For each prize position: find player in standings, transfer amount to wallet, create transaction with reason='tournament_prize', update prize.winner
  - Create audit log entry

#### 2g. Tournament Dashboard Pages

**Admin Tournament Management** (in AdminDashboard):
- Create tournament form (name, type, time control, entry fee, prize pool, dates, rules, banner upload)
- List all tournaments with status badges
- Start / Next Round / End / Cancel buttons per tournament

**Public Tournament Pages**:
- `/tournaments` — list all tournaments (filter: active/upcoming/past, type)
- `/tournaments/:id` — single tournament view with:
  - Tournament info header (name, type, time control, prize pool, entry fee)
  - Countdown timer to start/end
  - Participants list
  - Pairings for current round
  - Full leaderboard table
  - Registration button (if open)

#### 2h. Add to User model (tournament stats)
```javascript
tournamentRating: { type: Number, default: 1200 },
tournamentsPlayed: { type: Number, default: 0 },
tournamentsWon: { type: Number, default: 0 },
podiumFinishes: { type: Number, default: 0 },
bestFinish: { type: String }, // e.g. "1st", "2nd", "3rd"
totalPrizeMoney: { type: Number, default: 0 }
```

---

### STEP 3: ACHIEVEMENT / BADGE SYSTEM

#### 3a. Achievement Model
Create `server/models/Achievement.js`:
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['first_booking', 'first_course', 'first_tournament', 'tournament_winner', 'puzzle_master', 'coach_favorite', 'streak_7', 'streak_30', 'sessions_100', 'puzzle_1000'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String },  // icon class or URL
  unlockedAt: { type: Date, default: Date.now }
}
```

#### 3b. Achievement Trigger Points
- Hook into: booking completed, course completed, tournament won, puzzle milestone, streak milestones, session count milestones
- Create `server/services/achievementService.js` with `checkAndAward(userId, eventType)` function
- Call from relevant controllers (booking completion, course completion, tournament end, puzzle solve)

#### 3c. Display Badges
- Add badges section to profile page
- Add `/api/achievements` route:
  - `GET /api/achievements/mine` — user's unlocked achievements
  - `GET /api/achievements` — all possible achievements (for reference)

---

### STEP 4: COMMUNITY FORUM

The `Discussion` and `ForumReply` models already exist but have no routes or UI.

#### 4a. Forum Routes (`/api/forum`)
```
GET    /api/forum/discussions              → list discussions (paginated, filterable by category/tags)
POST   /api/forum/discussions              → create discussion
GET    /api/forum/discussions/:id          → get discussion with replies
PUT    /api/forum/discussions/:id          → update own discussion
DELETE /api/forum/discussions/:id          → delete own discussion (or admin)
POST   /api/forum/discussions/:id/like     → toggle like
POST   /api/forum/discussions/:id/pin      → admin: pin discussion

POST   /api/forum/discussions/:id/replies  → create reply
PUT    /api/forum/replies/:id              → update own reply
DELETE /api/forum/replies/:id              → delete own reply (or admin)
POST   /api/forum/replies/:id/solution     → mark as solution (discussion author only)
POST   /api/forum/replies/:id/like         → toggle like
```

#### 4b. Forum UI Pages
- `/forum` — discussion listing with categories, search, pagination
- `/forum/:id` — single discussion thread with replies, mark-as-solution, voting

#### 4c. Navigation
Add "Forum" link to navbar (all roles)

---

### STEP 5: OPENING LIBRARY MARKETPLACE

#### 5a. Coach can Create/Upload Opening Packs
Leverage the existing `OpeningLibrary` model — add:
- `isMarketplace: { type: Boolean, default: false }`
- `price: { type: Number, default: 0 }`
- `instructor: { type: ObjectId, ref: 'User' }`
- `fileUrls: [{ title, type: [pgn/video/pdf], url }]`

#### 5b. Routes
```
POST   /api/openings/marketplace/create    → coach: create listing
GET    /api/openings/marketplace           → public: browse openings
GET    /api/openings/marketplace/:id       → opening detail
POST   /api/openings/marketplace/:id/purchase → student: purchase (wallet/Razorpay)
```

#### 5c. UI Pages
- `/openings/marketplace` — browse opening packs by category/ECO/difficulty
- `/openings/marketplace/:id` — detail page with preview + purchase

---

### STEP 6: STUDENT ANALYTICS

#### 6a. Student Analytics Page
Create `client/src/pages/StudentAnalytics.js` at `/student/analytics` (student-only)

Sections:
- **Learning stats**: total hours spent, courses completed, sessions taken
- **Puzzle stats**: puzzle rating trend (line chart), accuracy over time, theme strengths/weaknesses (radar chart)
- **Tournament stats**: rating, tournaments played, wins, best finish, prize money
- **Opening stats**: most-played openings, win rate by opening
- **Win rate / accuracy**: by time control, by opponent rating

#### 6b. Backend Aggregation
Create `server/services/analyticsService.js` with:
- `getStudentLearningStats(userId)` — aggregate from Progress, Enrollment, Session
- `getStudentPuzzleStats(userId)` — from PuzzleProfile
- `getStudentTournamentStats(userId)` — from Tournament + TournamentRegistration
- `getStudentOpeningStats(userId)` — placeholder (requires game data)
- `getStudentRatingHistory(userId)` — placeholder

Route: `GET /api/analytics/student` → returns all above

---

### STEP 7: COACH ANALYTICS

#### 7a. Coach Analytics Page
Create `client/src/pages/CoachAnalytics.js` at `/coach/analytics` (coach-only)

Sections:
- **Revenue overview**: total earnings, monthly revenue chart, pending withdrawals
- **Student stats**: total students, active students, retention rate
- **Session stats**: total sessions, completion rate, average rating
- **Course stats**: published, enrolled, revenue per course, popular courses
- **Tournament stats**: participants from their coaching, tournament revenue (if they host)

#### 7b. Backend
Route: `GET /api/analytics/coach` → aggregates from Booking, Course, Enrollment, Withdrawal, Wallet

---

### STEP 8: NOTIFICATION SYSTEM

#### 8a. Notification Model
Create `server/models/Notification.js`:
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['tournament_created', 'registration_success', 'tournament_starting', 'round_started', 'result_submitted', 'prize_won', 'withdrawal_approved', 'withdrawal_rejected', 'course_approved', 'course_rejected', 'coach_verified', 'coach_rejected', 'booking_confirmed', 'session_reminder', 'achievement_unlocked'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object }, // extra payload (e.g. { tournamentId, courseId })
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

#### 8b. Notification Service
Create `server/services/notificationService.js` with:
- `createNotification(userId, type, title, message, data)` — creates in-app notification
- `sendPushNotification(userId, title, body)` — placeholder for future WebSocket/push

#### 8c. Routes
```
GET    /api/notifications              → user's notifications (paginated, newest first)
PUT    /api/notifications/:id/read     → mark as read
PUT    /api/notifications/read-all     → mark all as read
GET    /api/notifications/unread-count → badge count
```

#### 8d. UI
- Notification bell in navbar
- Notification dropdown with recent items
- `/notifications` page for full history

#### 8e. Integration Points
Add `createNotification()` calls to:
- Tournament registration, start, round, end, prize distribution
- Withdrawal approve/reject (admin controller)
- Course approve/reject (admin controller)
- Coach verify/reject (admin controller)
- Achievement unlock

---

### STEP 9: REAL-TIME ARCHITECTURE (Scalable Foundation)

**Do NOT fully implement live games.** Build the architecture so WebSocket integration is drop-in ready.

#### 9a. WebSocket Manager
Create `server/services/socketManager.js`:
```javascript
// Stub architecture — ready for Socket.IO integration
class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }
  initialize(server) {
    // Placeholder: this.io = new SocketIO(server, { cors: ... })
    // Placeholder: this.io.use(authMiddleware)
    // Placeholder: on connection → track user, join rooms
  }
  emitToUser(userId, event, data) {
    // Placeholder
  }
  emitToRoom(room, event, data) {
    // Placeholder
  }
  getConnectedUsers() {
    return this.connectedUsers;
  }
}
module.exports = new SocketManager();
```

#### 9b. Socket Events Specification
Document all future socket events:
```
Client → Server:
  join:tournament:{id}       → watch tournament live
  leave:tournament:{id}      → stop watching
  make:move                  → play move in a game
  chat:message               → live chat in tournament

Server → Client:
  tournament:pairings        → new pairings available
  tournament:standings       → standings updated
  tournament:round_started   → new round begins
  tournament:completed       → tournament finished
  game:move                  → opponent's move
  game:result                → game result
  notification:new           → new notification
  leaderboard:update         → leaderboard changed
```

---

### STEP 10: SECURITY ENHANCEMENTS

#### 10a. Audit Log
Create `server/models/AuditLog.js`:
```javascript
{
  action: { type: String, required: true },
  performedBy: { type: ObjectId, ref: 'User' },
  targetType: { type: String }, // 'user', 'course', 'tournament', 'withdrawal'
  targetId: { type: ObjectId },
  details: { type: Object },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

Create `server/services/auditService.js` with `log(action, performedBy, targetType, targetId, details, req)`.

Add audit calls to: user ban/delete, course approve/reject, withdrawal approve/reject, tournament create/start/end, prize distribution.

#### 10b. Rate Limiting (Extend existing)
Add tiered rate limits:
- `authLimiter` — 5 requests/min on /api/auth/register (prevent brute force)
- `apiLimiter` — keep existing 100/15min for general API
- `tournamentLimiter` — 30/min for tournament operations
- `withdrawalLimiter` — 5/min for withdrawal requests

#### 10c. Wallet Abuse Protection
- Prevent duplicate tournament registrations
- Validate entry fee before wallet debit
- Log all failed payment attempts
- Cap concurrent pending withdrawals to 1 (already exists)

---

### STEP 11: PLATFORM ANALYTICS (recharts)

Already have `recharts` in client dependencies. Build analytics pages:

#### 11a. Global Analytics (Admin Dashboard)
- Revenue line chart (by month)
- User growth area chart
- Course enrollment bar chart
- Tournament participation pie chart
- Booking/session completion donut chart
- Top coaches table (by earnings, by sessions)
- Top courses table (by enrollment, by revenue)

#### 11b. API
```
GET /api/admin/analytics/revenue      → { monthly: [{month, amount}] }
GET /api/admin/analytics/users        → { total, byRole, growth: [{month, count}] }
GET /api/admin/analytics/courses      → { total, byCategory, topEnrolled }
GET /api/admin/analytics/tournaments  → { total, active, totalPrizePool, topParticipants }
GET /api/admin/analytics/bookings     → { total, completionRate, monthlyRevenue }
```

---

### STEP 12: DATABASE OPTIMIZATION

#### 12a. Indexes to Add
```javascript
users: { role: 1, isActive: 1 }
enrollments: { student: 1, enrollmentStatus: 1, enrolledAt: -1 }
progress: { course: 1, student: 1 }
tournaments: { status: 1, startDate: -1 }
tournaments: { createdBy: 1, status: 1 }
transactions: { user: 1, createdAt: -1 }
notifications: { user: 1, isRead: 1, createdAt: -1 }
```

#### 12b. Pagination
Verify all list endpoints use pagination (page/limit). Add if missing.
Pattern to follow (from existing controllers):
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;
```

---

### STEP 13: FINAL — CODE GENERATION ORDER

Execute the implementation in THIS EXACT ORDER to maintain dependencies:

1. **Models first**: Tournament (enhance), Achievement (new), Notification (new), AuditLog (new)
2. **Services next**: auditService, notificationService, achievementService, pairingEngine, leaderboardService, socketManager (stub)
3. **Middleware**: permissions.js
4. **Controllers + Routes** (in order):
   - Admin system (routes/admin.js — expand existing file)
   - Tournaments (routes/tournaments.js — new file)
   - Achievements (routes/achievements.js — new file)
   - Forum (routes/forum.js — new file)
   - Opening marketplace (extend existing ai.js or new file)
   - Analytics (routes/analytics.js — new file)
   - Notifications (routes/notifications.js — new file)
5. **Client pages** (in order):
   - AdminDashboard
   - Tournament pages
   - Forum pages
   - Achievement showcase (update ProfilePage)
   - Notification bell + dropdown
6. **Wire up**: add routes to server.js, add nav items, add client routes to App.js
7. **Cron jobs**: add tournament auto-start/auto-end checks
8. **Integration**: call notification/achievement services from existing controllers (do not modify those controllers — create wrappers or middleware hooks)

---

## FINAL REMINDERS

- **NEVER** delete or edit an existing working controller function body.
- **NEVER** change existing route paths or HTTP methods.
- **NEVER** remove an existing import or dependency.
- **ALWAYS** add new functionality via new files first, then wire them in.
- If you need to call notification/achievement from an existing controller, create a post-action hook service rather than editing the controller directly.
- When in doubt, look at how the existing code in that specific file is structured and match it exactly.

---

Generate Phase 3 now. Start with the architecture report and dependency analysis, then implement step by step.
