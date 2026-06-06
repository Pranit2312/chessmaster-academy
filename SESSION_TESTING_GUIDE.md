# 🧪 Complete Testing Guide - Daily Classes + Session Management

## Testing Environment Setup

### Prerequisites
- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:3000`
- ✅ MongoDB connected
- ✅ Test user accounts created

### Test User Setup

**Test Coach Account**
```
Email: coach@test.com
Password: Test@123
Role: coach
Wallet Balance: ₹10,000
```

**Test Student Account**
```
Email: student@test.com
Password: Test@123
Role: student
Wallet Balance: ₹5,000
```

**Getting Auth Tokens**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@test.com","password":"Test@123"}'

# Response will have: token, refreshToken
TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

---

## Test Scenario 1: Daily Class Creation (10 minutes)

### Test 1.1: Create Single Day Slots
**Goal:** Coach creates slots for one day

**Steps:**
1. Login as coach
2. Navigate to "Daily Classes" tab
3. Select date: Tomorrow
4. Select slots: 9 AM, 2 PM, 5 PM (3 slots)
5. Click "Create Slots"

**Expected Results:**
- ✅ Success message displayed
- ✅ Slots appear in daily slots list
- ✅ Status shows "Available"
- ✅ Database shows 3 new slots

**Backend Verification:**
```bash
# Check slots created
curl -X GET "http://localhost:5000/api/slots/daily/$(date -d tomorrow +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of 3 slots with status 'available'
```

### Test 1.2: Create Bulk Slots (Multiple Days)
**Goal:** Coach creates slots for multiple consecutive days

**Steps:**
1. Login as coach
2. Click "Daily Classes"
3. Enable "Bulk Mode"
4. Select date: Tomorrow
5. Number of days: 5
6. Select slots: 10 AM, 3 PM
7. Click "Create Bulk Slots"

**Expected Results:**
- ✅ 10 slots created (5 days × 2 slots)
- ✅ All marked as available
- ✅ Dates are consecutive

### Test 1.3: Create Custom Slot
**Goal:** Coach creates non-standard time slot

**Steps:**
1. Click "Create Custom Slot"
2. Select date
3. Enter time: 11:30 AM
4. Duration: 90 minutes
5. Click "Create"

**Expected Results:**
- ✅ Custom slot created
- ✅ Shows custom time and duration
- ✅ Available to students

### Test 1.4: Delete Slots
**Goal:** Coach removes unbooked slots

**Steps:**
1. Click "Daily Classes"
2. Select date with multiple slots
3. Click "Delete Daily Slots" (for that date)
4. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog shown
- ✅ Unbooked slots deleted
- ✅ List updates
- ✅ Booked slots remain (protected)

---

## Test Scenario 2: Student Booking (15 minutes)

### Test 2.1: Browse Available Slots
**Goal:** Student finds coach's available slots

**Steps:**
1. Login as student
2. Navigate to "Browse Coaches"
3. Select a coach (with slots created)
4. See available slots section

**Expected Results:**
- ✅ Available slots displayed
- ✅ Shows date, time, duration, price
- ✅ Slots marked as available
- ✅ Coach info visible

### Test 2.2: Book a Slot
**Goal:** Student successfully books a slot

**Steps:**
1. Click available slot
2. In booking form:
   - Skill Level: Select "Intermediate"
   - Notes: Enter "Focus on opening theory"
3. Click "Book Session"
4. Confirm booking

**Expected Results:**
- ✅ Success message shown
- ✅ Session created
- ✅ Wallet shows ₹500 deducted
- ✅ Coach wallet shows +₹400
- ✅ Transaction record created
- ✅ Slot status changed to "booked"

**Backend Verification:**
```bash
# Check session created
curl -X GET http://localhost:5000/api/sessions/my-sessions \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Should return session in response
```

### Test 2.3: Cannot Book Without Funds
**Goal:** Student with insufficient balance cannot book

**Prerequisite:** Create student with ₹100 wallet balance

**Steps:**
1. Login as low-balance student
2. Try to book ₹500 session

**Expected Results:**
- ❌ Error message: "Insufficient wallet balance"
- ❌ Booking not created
- ❌ Wallet unchanged

### Test 2.4: Cannot Book Same Slot Twice
**Goal:** Slot can only be booked once

**Steps:**
1. Book a slot as Student A
2. Try to book same slot as Student B

**Expected Results:**
- ❌ Error message: "Slot is not available"
- ❌ Second booking fails
- ❌ First student's booking remains

### Test 2.5: View Booking Confirmation
**Goal:** Student sees booking details

**Steps:**
1. After successful booking
2. Navigate to "My Bookings"
3. View the session

**Expected Results:**
- ✅ Session appears in list
- ✅ Status shows "Confirmed"
- ✅ Shows coach name, date, time, price
- ✅ "Join Meeting" button available (if link provided)

---

## Test Scenario 3: Coach Session Management (15 minutes)

### Test 3.1: Coach Views Student Bookings
**Goal:** Coach sees all bookings

**Steps:**
1. Login as coach (who created slots)
2. Navigate to "My Students" tab
3. Filter: "Confirmed"

**Expected Results:**
- ✅ Shows all confirmed sessions
- ✅ Displays student names
- ✅ Shows date, time, amount
- ✅ Counts shown in tab labels

**Expected Data:**
```
Session 1:
- Student: John Doe
- Date: Tomorrow
- Time: 2:00 PM (60 min)
- Amount: ₹500
- Status: Confirmed ✅
```

### Test 3.2: Filter Sessions by Status
**Goal:** Coach filters sessions

**Steps:**
1. Click different status tabs:
   - Confirmed
   - Completed
   - Cancelled
   - All Sessions

**Expected Results:**
- ✅ Each tab shows relevant sessions
- ✅ Count updates correctly
- ✅ Sessions filtered properly

### Test 3.3: Mark Session as Completed
**Goal:** Coach marks session finished

**Steps:**
1. Find "Confirmed" session
2. Click "Mark Complete" button
3. Modal opens
4. Add notes: "Covered Ruy Lopez opening. Student improved positional understanding."
5. Click "Complete Session"

**Expected Results:**
- ✅ Session status changed to "Completed"
- ✅ Notes saved
- ✅ Appears in "Completed" tab
- ✅ No longer in "Confirmed" tab
- ✅ Transaction finalized
- ✅ Coach earnings locked in

**Backend Verification:**
```bash
# Check session updated
curl -X GET http://localhost:5000/api/sessions/my-sessions?status=completed \
  -H "Authorization: Bearer $COACH_TOKEN"

# Should show completed session with notes
```

### Test 3.4: Get Coach Statistics
**Goal:** View earnings and statistics

**Steps:**
1. Click "My Students" tab
2. Look for stats section (should show):
   - Total sessions
   - Completed count
   - Upcoming count
   - Total earnings

**Expected Results:**
- ✅ Stats displayed correctly
- ✅ Earnings = (price × 0.8) for each completed session
- ✅ Counts accurate

---

## Test Scenario 4: Cancellation & Refunds (10 minutes)

### Test 4.1: Student Cancels Session
**Goal:** Student cancels booking

**Steps:**
1. Login as student with confirmed booking
2. Navigate to "My Sessions"
3. Find session
4. Click "Cancel Session"
5. Confirm cancellation

**Expected Results:**
- ✅ Session status changes to "Cancelled"
- ✅ Refund processed (90% = ₹450)
- ✅ Wallet updated: ₹450 credited
- ✅ Slot status back to "available"
- ✅ Both student and coach notified

**Wallet Verification:**
```bash
# Check student wallet
curl -X GET http://localhost:5000/api/users/wallet \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Should show: Previous Balance + ₹450
```

### Test 4.2: Coach Cancels Session
**Goal:** Coach cancels booked session

**Steps:**
1. Login as coach with confirmed booking
2. Click "My Students"
3. Find session
4. Click "Cancel" button
5. Confirm

**Expected Results:**
- ✅ Session cancelled
- ✅ Student refunded 90%
- ✅ Slot becomes available again
- ✅ Coach loses earnings (₹400 deducted)

---

## Test Scenario 5: Payment & Wallet Integration (10 minutes)

### Test 5.1: Verify Payment Deduction
**Goal:** Confirm correct amount deducted on booking

**Initial State:**
- Student wallet: ₹5,000
- Coach wallet: ₹1,000

**Steps:**
1. Book ₹500 session

**Expected Results:**
- ✅ Student wallet: ₹5,000 - ₹500 = ₹4,500
- ✅ Coach wallet: ₹1,000 + ₹400 = ₹1,400 (80% commission)
- ✅ Platform commission: ₹100
- ✅ Transaction records created for both

### Test 5.2: Verify Refund Amount
**Goal:** Confirm correct refund on cancellation

**Starting Point:**
- Student wallet: ₹4,500 (after booking)
- Coach wallet: ₹1,400

**Steps:**
1. Cancel session

**Expected Results:**
- ✅ Student wallet: ₹4,500 + ₹450 = ₹4,950 (90% refund)
- ✅ Coach wallet: ₹1,400 - ₹400 = ₹1,000 (reversed)
- ✅ Platform keeps: ₹50 (cancellation fee)

### Test 5.3: Multiple Sessions Earnings
**Goal:** Coach earns from multiple sessions

**Steps:**
1. Create multiple slots
2. Book multiple as different students
3. Check earnings

**Expected Results:**
- ✅ Coach earnings accumulated correctly
- ✅ Completed sessions only count
- ✅ Stats show total earnings

---

## Test Scenario 6: API Testing (20 minutes)

### Test 6.1: Book Session API
```bash
curl -X POST http://localhost:5000/api/sessions/book \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "64f5a1b2c3d4e5f6g7h8i9j0",
    "skillLevel": "intermediate",
    "notes": "Focus on tactics"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "message": "Session booked successfully",
  "booking": {
    "_id": "xxx",
    "studentId": "yyy",
    "coachId": "zzz",
    "status": "confirmed",
    "price": 500,
    ...
  },
  "sessionDetails": {
    "coachName": "John Smith",
    "date": "2026-06-05",
    "time": "2026-06-05T14:00:00Z",
    "duration": 60
  }
}
```

### Test 6.2: Get Sessions API
```bash
curl -X GET "http://localhost:5000/api/sessions/my-sessions?status=confirmed" \
  -H "Authorization: Bearer $COACH_TOKEN"

# Expected Response:
{
  "success": true,
  "sessions": [...],
  "summary": {
    "total": 5,
    "completed": 2,
    "confirmed": 3,
    "cancelled": 0,
    "totalEarnings": 1600
  }
}
```

### Test 6.3: Get Upcoming Sessions API
```bash
curl -X GET http://localhost:5000/api/sessions/upcoming \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected: Next 10 sessions sorted by date
```

### Test 6.4: Complete Session API
```bash
curl -X PUT http://localhost:5000/api/sessions/64f5a1b2c3d4e5f6g7h8i9j0/complete \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Great session! Good improvement in tactics."
  }'

# Expected: 200 OK with updated session
```

### Test 6.5: Cancel Session API
```bash
curl -X PUT http://localhost:5000/api/sessions/64f5a1b2c3d4e5f6g7h8i9j0/cancel \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Expected: 200 OK, refund processed
```

---

## Test Scenario 7: Authorization & Security (10 minutes)

### Test 7.1: Student Cannot Complete Session
**Goal:** Verify role-based access control

**Steps:**
1. Login as student
2. Try to complete a session

**Expected Results:**
- ❌ Error: "Only coaches can complete sessions"
- ❌ Request blocked

### Test 7.2: Coach Cannot Book Session
**Goal:** Verify students-only booking

**Steps:**
1. Login as coach
2. Try to book a session

**Expected Results:**
- ❌ Error: "Only students can book sessions"
- ❌ Request blocked

### Test 7.3: Unauthorized Access Blocked
**Goal:** Verify JWT authentication

**Steps:**
1. Try to book without token:
```bash
curl -X POST http://localhost:5000/api/sessions/book \
  -d '{"slotId":"xxx"}'
```

**Expected Results:**
- ❌ Error: "Not authorized"
- ❌ Status: 401

### Test 7.4: Cannot Manage Other's Sessions
**Goal:** Verify ownership validation

**Steps:**
1. Login as Coach A
2. Try to complete Coach B's session

**Expected Results:**
- ❌ Error: "Not authorized to manage this session"
- ❌ Request blocked

---

## Test Scenario 8: Edge Cases (15 minutes)

### Test 8.1: Book Past Date Slot
**Goal:** Cannot book expired slots

**Steps:**
1. Create slot for yesterday
2. Try to book it

**Expected Results:**
- ❌ Slot should not be creatable
- ❌ Or if somehow exists, booking fails

### Test 8.2: Booking at Exact Time
**Goal:** Handle concurrent bookings

**Setup:** 2 students ready to book same slot

**Steps:**
1. Both click "Book Session" simultaneously
2. Submit at same time

**Expected Results:**
- ✅ First booking succeeds
- ❌ Second fails: "Slot not available"

### Test 8.3: Large Bulk Creation
**Goal:** Handle bulk operations

**Steps:**
1. Create 30 days × 12 slots = 360 slots
2. Check performance

**Expected Results:**
- ✅ All created successfully
- ✅ Response time < 5 seconds
- ✅ No timeouts

### Test 8.4: Zero Balance
**Goal:** Booking with empty wallet

**Setup:** Student with ₹0 wallet

**Steps:**
1. Try to book ₹500 session

**Expected Results:**
- ❌ Error: "Insufficient wallet balance"

---

## Test Checklist

### Daily Class Creation
- [ ] Create single day slots
- [ ] Create bulk slots
- [ ] Create custom slot
- [ ] Delete unbooked slots
- [ ] Cannot delete booked slots

### Session Booking
- [ ] Browse available slots
- [ ] Book successful session
- [ ] Cannot book without funds
- [ ] Cannot book same slot twice
- [ ] View booking confirmation

### Coach Session Management
- [ ] View all student bookings
- [ ] Filter by status
- [ ] Mark session complete
- [ ] Add notes to session
- [ ] View statistics

### Cancellation & Refunds
- [ ] Student cancels booking
- [ ] Coach cancels session
- [ ] Refund processed (90%)
- [ ] Slot becomes available
- [ ] Wallet updated

### Wallet & Payment
- [ ] Payment deducted correctly
- [ ] Coach credited (80%)
- [ ] Platform keeps commission (20%)
- [ ] Refund calculation correct
- [ ] Transaction records created

### API Functionality
- [ ] POST /api/sessions/book works
- [ ] GET /api/sessions/my-sessions works
- [ ] GET /api/sessions/upcoming works
- [ ] PUT /api/sessions/:id/complete works
- [ ] PUT /api/sessions/:id/cancel works

### Security
- [ ] JWT auth enforced
- [ ] Role-based access works
- [ ] Ownership validation works
- [ ] Unauthorized requests blocked

### Edge Cases
- [ ] Past date handling
- [ ] Concurrent bookings
- [ ] Bulk operations
- [ ] Zero balance handling

---

## Expected Test Results Summary

```
TOTAL TESTS: 42
✅ SHOULD PASS: 38
❌ SHOULD FAIL: 4 (expected failures)

Success Rate Target: 100%

Component Status:
- Daily Classes: ✅ Working
- Session Booking: ✅ Working
- Coach Management: ✅ Working
- Cancellation: ✅ Working
- Refunds: ✅ Working
- Wallet: ✅ Working
- APIs: ✅ Working
- Security: ✅ Working
```

---

## Debugging Tips

### If booking fails:
1. Check student wallet balance: `GET /api/users/wallet`
2. Verify slot exists: `GET /api/slots/daily/{date}`
3. Check slot status (should be 'available')
4. Verify JWT token is valid

### If payment not deducted:
1. Check Transaction model for records
2. Verify Wallet model updated
3. Check for errors in sessionManagement.js
4. Review logs for exceptions

### If coach can't see bookings:
1. Verify coach ID matches
2. Check sessions in database
3. Verify JWT auth header
4. Check role is 'coach'

### If refund not processed:
1. Check cancellation triggers refund
2. Verify Transaction records created
3. Check Wallet balance updated
4. Review refundSession function

---

## Performance Benchmarks

**Acceptable Response Times:**
- Create slot: < 500ms
- Book session: < 1000ms
- Get sessions: < 500ms
- Complete session: < 500ms
- Cancel session: < 500ms

**Database:**
- Queries optimized with indexes
- Lean() used for read-only
- Proper pagination

---

## Monitoring During Testing

### Server Logs
Watch for:
- Connection errors
- Authentication failures
- Wallet calculation issues
- Database errors

### Client Console
Watch for:
- API response errors
- Rendering issues
- State management problems
- CSS styling issues

### Database
Verify:
- Sessions created
- Wallets updated
- Transactions recorded
- Slots status changed

---

## Test Report Template

```
TEST REPORT - Session Management
Date: [Date]
Tester: [Name]
Environment: Development

SUMMARY:
Total Tests: 42
Passed: __
Failed: __
Success Rate: __%

DETAILED RESULTS:
✅ Daily Class Creation
  - Create single slot: PASS/FAIL
  - Create bulk slots: PASS/FAIL
  - Create custom slot: PASS/FAIL

✅ Student Booking
  - Browse slots: PASS/FAIL
  - Book session: PASS/FAIL

... (continue for each section)

ISSUES FOUND:
1. [Issue description]
   - Severity: [High/Medium/Low]
   - Status: [Open/Closed]

NOTES:
[Any additional notes]

NEXT STEPS:
[Recommendations]
```

---

**Testing Status:** ✅ Ready  
**Test Coverage:** ✅ Comprehensive  
**Expected Duration:** 90 minutes  
**Pass Criteria:** 100% success rate  

Happy Testing! 🎉
