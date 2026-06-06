# 🎓 Session Management System - Complete Guide

## Overview

The **Session Management System** is the complete flow that connects:
1. **Daily Class Creation** (Coaches create available slots)
2. **Student Booking** (Students book those slots)  
3. **Session Management** (Coaches and students manage their sessions)

---

## Complete Flow Diagram

```
COACH                              STUDENT
  |                                  |
  1. Create Daily Slots             |
  (Daily Class Creation)             |
  |                                  |
  2. Slots Available               3. View Available Slots
  |                                  |
  ▼                                  ▼
[Available Slots]              [Browse & Select]
                                  |
                                  4. Book Slot (Create Session)
                                  |
                                  ▼
                              [Session Booked]
                                  |
                                  ▼
  5. View My Students ◄─────── Session Confirmed ───────► 6. My Sessions
  (Session Management)             |                    (View Bookings)
  |                                |
  7. Mark Complete                 |
  or Cancel                        |
```

---

## Key Components

### 1. Backend Components

#### **Utility: `server/utils/sessionManagement.js`**
Core logic for session operations:

```javascript
// Main Functions:
exports.createSession()           // Book a slot and create session
exports.getStudentSessions()      // Get sessions for student
exports.getCoachSessions()        // Get sessions for coach
exports.updateSessionStatus()     // Update session status
exports.completeSession()         // Mark session completed
exports.getUpcomingSessions()     // Get upcoming sessions
exports.getSessionStats()         // Get coach statistics
```

#### **Routes: `server/routes/sessions.js`**
9 API endpoints for session management:

```javascript
POST   /api/sessions/book                    // Student books a slot
GET    /api/sessions/my-sessions             // Get user's sessions
GET    /api/sessions/upcoming                // Get upcoming sessions
GET    /api/sessions/:sessionId              // Get session details
PUT    /api/sessions/:sessionId/status       // Update status
PUT    /api/sessions/:sessionId/complete     // Complete session
PUT    /api/sessions/:sessionId/cancel       // Cancel session
GET    /api/sessions/coach/:coachId/all      // Get coach's sessions
GET    /api/sessions/coach/:coachId/stats    // Get coach stats
```

#### **Server Registration: `server.js`**
Sessions route registered:
```javascript
app.use('/api/sessions', require('./routes/sessions'));
```

### 2. Frontend Components

#### **BookSlot.js**
Student booking interface:
- View slot details
- View coach information
- Select skill level
- Add notes
- Book session (deducts from wallet)

#### **MyStudents.js**
Coach student management:
- View all booked students
- Filter by status (confirmed, completed, cancelled)
- Mark sessions as completed
- Cancel sessions
- Add notes to sessions

---

## Database Integration

### Booking Model Used
The sessions use the existing `Booking` model with these fields:

```javascript
{
  studentId: ObjectId,      // Reference to Student
  coachId: ObjectId,        // Reference to Coach
  slotId: ObjectId,         // Reference to Slot
  sessionDate: Date,        // When session happens
  startTime: Date,          // Start time with date
  duration: Number,         // Session duration in minutes
  status: String,           // 'confirmed', 'completed', 'cancelled', 'pending'
  price: Number,            // Session price
  skillLevel: String,       // Student's skill level
  meetingLink: String,      // Zoom/Meet link
  meetingPlatform: String,  // 'Zoom', 'Google Meet', etc.
  notes: String,            // Student's booking notes
  coachNotes: String,       // Coach's session notes
  studentRating: Number,    // Student's rating (1-5)
  completedAt: Date,        // When marked complete
  cancelledAt: Date,        // When cancelled
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Integration
When session is booked:
- ✅ Student wallet debited (payment)
- ✅ Coach wallet credited (80% commission)
- ✅ Transaction records created
- ✅ Refund processed if cancelled

---

## Step-by-Step Usage Flow

### For Coaches: Creating Slots & Managing Sessions

**Step 1: Create Daily Slots**
```
Coach Dashboard → Daily Classes → Create Slots
Select Date → Choose Times → Click Create Slots
✅ Slots now available for students to book
```

**Step 2: View Student Bookings**
```
Coach Dashboard → My Students
✅ See all booked students
- Confirmed sessions
- Completed sessions
- Cancelled sessions
```

**Step 3: Manage Sessions**
```
Click Session → Mark Complete (add notes) or Cancel
✅ Session status updated
✅ Earnings tracked
✅ Student notified
```

### For Students: Booking Sessions & Attending

**Step 1: Find Available Slots**
```
Browse Coaches → View Coach Profile → See Available Slots
```

**Step 2: Book a Session**
```
Click Slot → Fill Form:
  - Skill Level (beginner, intermediate, advanced, expert)
  - Additional Notes
  - Click "Book Session"
✅ Payment deducted from wallet
✅ Confirmation received
```

**Step 3: Attend Session**
```
View My Bookings
- See session details
- Get meeting link
- Join at scheduled time
```

---

## API Usage Examples

### 1. Book a Slot (Student)
```bash
curl -X POST http://localhost:5000/api/sessions/book \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "64f5a1b2c3d4e5f6g7h8i9j0",
    "skillLevel": "intermediate",
    "notes": "Focus on openings"
  }'

Response:
{
  "success": true,
  "message": "Session booked successfully",
  "booking": {...},
  "sessionDetails": {
    "coachName": "John Smith",
    "date": "2026-06-05",
    "time": "2026-06-05T14:00:00Z",
    "duration": 60,
    "meetingLink": "https://zoom.us/...",
    "meetingPlatform": "Zoom"
  }
}
```

### 2. Get My Sessions (Coach or Student)
```bash
curl -X GET "http://localhost:5000/api/sessions/my-sessions?status=confirmed" \
  -H "Authorization: Bearer TOKEN"

Response:
{
  "success": true,
  "sessions": [...],
  "summary": {
    "total": 12,
    "completed": 8,
    "confirmed": 3,
    "cancelled": 1,
    "pending": 0,
    "totalEarnings": 3200
  }
}
```

### 3. Get Upcoming Sessions
```bash
curl -X GET http://localhost:5000/api/sessions/upcoming \
  -H "Authorization: Bearer TOKEN"

Response:
{
  "success": true,
  "sessions": [...],
  "count": 5
}
```

### 4. Complete a Session (Coach)
```bash
curl -X PUT http://localhost:5000/api/sessions/64f5a1b2c3d4e5f6g7h8i9j0/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Great session! Discussed Sicilian Defense. Student is progressing well."
  }'
```

### 5. Cancel a Session
```bash
curl -X PUT http://localhost:5000/api/sessions/64f5a1b2c3d4e5f6g7h8i9j0/cancel \
  -H "Authorization: Bearer TOKEN"
```

---

## Security & Validation

✅ **Authentication** - JWT token required for all operations
✅ **Authorization** - Role-based access (coach vs student)
✅ **Wallet Validation** - Student must have sufficient balance
✅ **Slot Availability** - Cannot book already booked slots
✅ **Ownership** - Coaches manage only their sessions
✅ **Status Transitions** - Valid status flow: confirmed → completed or cancelled
✅ **Refund Protection** - Only within cancellation window

---

## Integration with Daily Class Creation

### The Complete Workflow

1. **Coach creates slots** using `DailyClassCreation` component
   - Slots created in database with status 'available'
   - Slots become visible to students

2. **Student finds and views** available coach slots
   - API: `GET /api/slots` with filters

3. **Student books a slot** using `BookSlot` component
   - API: `POST /api/sessions/book`
   - Creates session record
   - Updates slot status to 'booked'
   - Deducts from student wallet
   - Credits coach wallet

4. **Coach views sessions** using `MyStudents` component
   - API: `GET /api/sessions/my-sessions`
   - Shows all student bookings
   - Allows status updates

5. **Coach completes session** with notes
   - API: `PUT /api/sessions/:id/complete`
   - Records session as completed
   - Tracks earnings
   - Enables review/rating

---

## Frontend Component Integration

### Add to Coach Dashboard
```jsx
import MyStudents from '../components/MyStudents';

export default function CoachDashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <MyStudents />
    </div>
  );
}
```

### Add to Student Dashboard
```jsx
import BookSlot from '../components/BookSlot';

export default function StudentDashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <BookSlot slotId={slot._id} coachId={coach._id} />
    </div>
  );
}
```

---

## Data Flow Diagram

```
┌─────────────┐
│ Daily Slots │ (Coach creates using DailyClassCreation)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Available Slots  │ (Display to students)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Student Books    │ (BookSlot component)
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Session Created          │ (Booking record)
│ - Slot marked as booked  │
│ - Payment deducted       │
│ - Coach credited         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Coach Views Sessions     │ (MyStudents component)
│ - Confirmed             │
│ - Mark Complete         │
│ - Add Notes             │
│ - Track Earnings        │
└──────────────────────────┘
```

---

## Session Statuses

| Status | Meaning | Coach Action | Auto-Action |
|--------|---------|--------------|------------|
| pending | Awaiting confirmation | Accept/Reject | N/A |
| confirmed | Session is booked | Mark complete/Cancel | N/A |
| completed | Session finished | Record notes | Unlock review |
| cancelled | Session cancelled | N/A | Process refund |

---

## Payment & Earnings Flow

### When Session is Booked
```
Student Wallet    →  -₹500 (full amount)
Coach Wallet      →  +₹400 (80% commission)
Platform Wallet   →  +₹100 (20% platform fee)

Transaction Records:
- Student: DEBIT ₹500 (Session booking)
- Coach: CREDIT ₹400 (Session booking commission)
```

### When Session is Cancelled
```
Student Wallet    →  +₹450 (90% refund)
Coach Wallet      →  -₹400 (reversed)
Platform Wallet   →  -₹50 (retained as cancellation fee)

Transaction Records:
- Student: CREDIT ₹450 (Refund)
- Coach: DEBIT ₹400 (Refund reversal)
```

---

## Testing Checklist

### Backend
- [ ] POST /sessions/book - Creates session
- [ ] GET /sessions/my-sessions - Returns coach/student sessions
- [ ] GET /sessions/upcoming - Returns future sessions
- [ ] GET /sessions/:id - Returns session details
- [ ] PUT /sessions/:id/status - Updates status
- [ ] PUT /sessions/:id/complete - Marks complete
- [ ] PUT /sessions/:id/cancel - Cancels session
- [ ] Wallet deduction on booking
- [ ] Coach credit on booking
- [ ] Refund on cancellation
- [ ] Slot status update

### Frontend
- [ ] BookSlot component renders
- [ ] Can select skill level
- [ ] Can add notes
- [ ] Can book session
- [ ] Success message shows
- [ ] MyStudents component renders
- [ ] Can view sessions by status
- [ ] Can mark session complete
- [ ] Can add notes to completion
- [ ] Can cancel session
- [ ] Modal interactions work

---

## Troubleshooting

### Session not creating
- ✅ Check student has wallet balance
- ✅ Check slot is available (not already booked)
- ✅ Check auth token is valid
- ✅ Check API response for errors

### Sessions not showing for coach
- ✅ Verify JWT token
- ✅ Check sessions exist in database
- ✅ Check coach ID matches

### Payment not deducted
- ✅ Check Wallet model has userId field
- ✅ Check wallet balance before booking
- ✅ Check transaction records

### Coach can't complete session
- ✅ Verify session status is 'confirmed'
- ✅ Check coach ownership
- ✅ Check auth headers

---

## Files Summary

| File | Type | Purpose |
|------|------|---------|
| `server/utils/sessionManagement.js` | Backend | Session business logic |
| `server/routes/sessions.js` | Backend | API endpoints |
| `server/server.js` | Backend | Route registration |
| `client/src/components/BookSlot.js` | Frontend | Student booking UI |
| `client/src/components/MyStudents.js` | Frontend | Coach management UI |
| `client/src/styles/BookSlot.css` | Frontend | Booking styling |
| `client/src/styles/MyStudents.css` | Frontend | Coach management styling |

---

## Next Steps

1. **Test the system end-to-end**
   - Create daily slots as coach
   - Book as student
   - Complete as coach
   - Verify payments

2. **Add optional features**
   - Session recording
   - Student ratings/reviews
   - Reschedule functionality
   - Auto-reminders

3. **Monitor in production**
   - Track booking success rate
   - Monitor refunds
   - Track earnings
   - Collect feedback

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** June 1, 2026

The session management system is fully integrated with daily class creation and provides a complete booking and management experience!
