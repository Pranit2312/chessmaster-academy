# Daily Class Creation - Coach Manual Slot Management

## Overview

The **Daily Class Creation** feature allows coaches to manually create and manage their available teaching slots for each day. This is a core feature that enables coaches to set up their availability, which students can then book.

## Features

✅ **Manual Daily Slot Creation** - Create predefined time slots for any date  
✅ **Bulk Creation** - Create slots for multiple consecutive days at once  
✅ **Custom Slots** - Create custom time slots outside predefined hours  
✅ **Easy Management** - View, edit, and delete daily slots  
✅ **Responsive UI** - Works on desktop, tablet, and mobile  
✅ **Real-time Updates** - Instant feedback on slot creation/deletion  

## Architecture

### Backend Components

#### 1. **Utility: `server/utils/dailyClassCreation.js`**
Core logic for slot management operations:

```javascript
// Main functions:
- createDailySlots(coachId, date, selectedSlots)     // Create slots for a date
- createBulkDailySlots(coachId, startDate, days)    // Create slots for multiple days
- createCustomSlot(coachId, date, time, duration)   // Create custom time slot
- getCoachSlotsForDate(coachId, date)               // Fetch slots for a date
- deleteDailySlots(coachId, date)                   // Delete all slots for a date
- getPredefinedSlots()                              // Get slot template
```

#### 2. **Controller: `server/controllers/slotController.js`**
API endpoint handlers:

```javascript
// New methods:
- createDailySlots(req, res)          // POST /api/slots/daily/create
- createBulkDailySlots(req, res)      // POST /api/slots/daily/bulk
- createCustomSlot(req, res)          // POST /api/slots/daily/custom
- getDailySlotsForDate(req, res)      // GET /api/slots/daily/:date
- deleteDailySlots(req, res)          // DELETE /api/slots/daily/:date
- getPredefinedSlots(req, res)        // GET /api/slots/predefined/list
```

#### 3. **Routes: `server/routes/slots.js`**
Endpoint definitions:

```javascript
// Daily class creation endpoints:
POST   /api/slots/daily/create       // Create slots for a day
POST   /api/slots/daily/bulk         // Bulk create for multiple days
POST   /api/slots/daily/custom       // Create custom time slot
GET    /api/slots/daily/:date        // Get slots for a date
DELETE /api/slots/daily/:date        // Delete slots for a date
GET    /api/slots/predefined/list    // Get time slot templates
```

### Frontend Components

#### **`client/src/components/DailyClassCreation.js`**
React component with full slot management UI:

- Date picker for slot creation date
- Mode toggle (single day / bulk mode)
- Time slot selection grid
- Select all / deselect all buttons
- Real-time slot display
- Create and delete actions
- Success/error messages
- Responsive design

## Predefined Time Slots

The system comes with 12 predefined time slots (9 AM - 9 PM):

```javascript
[
  { time: '09:00', duration: 60, label: '9:00 AM - 10:00 AM' },
  { time: '10:00', duration: 60, label: '10:00 AM - 11:00 AM' },
  { time: '11:00', duration: 60, label: '11:00 AM - 12:00 PM' },
  { time: '12:00', duration: 60, label: '12:00 PM - 1:00 PM' },
  { time: '13:00', duration: 60, label: '1:00 PM - 2:00 PM' },
  { time: '14:00', duration: 60, label: '2:00 PM - 3:00 PM' },
  { time: '15:00', duration: 60, label: '3:00 PM - 4:00 PM' },
  { time: '16:00', duration: 60, label: '4:00 PM - 5:00 PM' },
  { time: '17:00', duration: 60, label: '5:00 PM - 6:00 PM' },
  { time: '18:00', duration: 60, label: '6:00 PM - 7:00 PM' },
  { time: '19:00', duration: 60, label: '7:00 PM - 8:00 PM' },
  { time: '20:00', duration: 60, label: '8:00 PM - 9:00 PM' }
]
```

## API Endpoints

### 1. Get Predefined Slots Template
```bash
GET /api/slots/predefined/list

Response:
{
  "success": true,
  "message": "Predefined time slots template",
  "totalSlots": 12,
  "slots": [...]
}
```

### 2. Create Daily Slots
```bash
POST /api/slots/daily/create
Content-Type: application/json
Authorization: Bearer <TOKEN>

Body:
{
  "date": "2026-06-05",
  "selectedSlots": [
    { "time": "09:00", "duration": 60, "label": "9:00 AM - 10:00 AM" },
    { "time": "14:00", "duration": 60, "label": "2:00 PM - 3:00 PM" }
  ]
}

Response:
{
  "success": true,
  "message": "Created 2 slots for Fri Jun 05 2026",
  "date": "2026-06-05T00:00:00.000Z",
  "slotsCreated": 2,
  "slots": [...]
}
```

### 3. Create Bulk Slots (Multiple Days)
```bash
POST /api/slots/daily/bulk
Content-Type: application/json
Authorization: Bearer <TOKEN>

Body:
{
  "startDate": "2026-06-05",
  "numberOfDays": 7,
  "selectedSlots": [
    { "time": "09:00", "duration": 60, "label": "9:00 AM - 10:00 AM" },
    { "time": "14:00", "duration": 60, "label": "2:00 PM - 3:00 PM" }
  ]
}

Response:
{
  "success": true,
  "message": "Created slots for 7 days",
  "daysCreated": 7,
  "results": [...]
}
```

### 4. Create Custom Slot
```bash
POST /api/slots/daily/custom
Content-Type: application/json
Authorization: Bearer <TOKEN>

Body:
{
  "date": "2026-06-05",
  "time": "14:30",
  "duration": 90
}

Response:
{
  "success": true,
  "message": "Custom slot created successfully",
  "slot": {...}
}
```

### 5. Get Slots for Date
```bash
GET /api/slots/daily/2026-06-05
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "date": "2026-06-05T00:00:00.000Z",
  "totalSlots": 2,
  "availableSlots": 2,
  "slots": [...]
}
```

### 6. Delete Daily Slots
```bash
DELETE /api/slots/daily/2026-06-05
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "message": "Deleted 2 slots",
  "deletedCount": 2
}
```

## Database Model

Slots are stored in MongoDB using the **Slot** model:

```javascript
{
  _id: ObjectId,
  coachId: ObjectId,          // Reference to User (Coach)
  date: Date,                 // Date of slot
  startTime: Date,            // Start time with date
  duration: Number,           // Duration in minutes
  status: String,             // 'available', 'booked', 'completed', 'unavailable'
  isBooked: Boolean,          // Whether slot is booked
  bookedBy: ObjectId,         // Reference to User (Student) if booked
  skillLevel: String,         // Optional: 'beginner', 'intermediate', 'advanced', 'all'
  meetingLink: String,        // Optional: Zoom/Google Meet link
  meetingPlatform: String,    // 'Zoom', 'Google Meet', etc.
  notes: String,              // Optional: Additional notes
  price: Number,              // Optional: Session price
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

### Step 1: Import Component
```jsx
import DailyClassCreation from './components/DailyClassCreation';
```

### Step 2: Add to Coach Dashboard
```jsx
function CoachDashboard() {
  return (
    <div className="coach-dashboard">
      {/* ... other components */}
      <DailyClassCreation coachId={coachId} />
    </div>
  );
}
```

### Step 3: Ensure Token is Available
The component requires a valid JWT token in localStorage:
```javascript
// Set during login
localStorage.setItem('token', response.data.token);
```

## Usage Flow

### For Coaches:

1. **Navigate** to Daily Class Creation section (Coach Dashboard)
2. **Select Date** - Choose the date for which to create slots
3. **Choose Mode** - Single day or bulk creation for multiple days
4. **Select Slots** - Check the time slots you want to offer
5. **Click "Create Slots"** - Slots are created and students can book them
6. **View Created Slots** - See all created slots for the selected date
7. **Delete if Needed** - Remove all unbooked slots with "Delete All Slots"

### For Students:

1. Browse available coaches
2. View coach's availability calendar
3. Select available slots
4. Book session
5. Receive confirmation with meeting details

## Security & Validations

✅ **Authentication** - Only logged-in coaches can create slots  
✅ **Authorization** - Coaches can only manage their own slots  
✅ **Date Validation** - Cannot create slots in the past  
✅ **Overlap Prevention** - System prevents duplicate slots at same time  
✅ **Booked Protection** - Cannot modify/delete booked slots  
✅ **Role Validation** - Only users with 'coach' role can create slots  

## Error Handling

Common error responses:

```javascript
// Missing date
{ "success": false, "message": "Date is required" }

// No slots selected
{ "success": false, "message": "Please select at least one time slot" }

// Slots already exist
{ "success": false, "message": "Slots already exist for this date..." }

// Cannot delete booked slot
{ "success": false, "message": "Cannot delete a booked slot" }

// Not authorized
{ "success": false, "message": "Not authorized to update this slot" }
```

## Customization

### Change Predefined Slots

Edit `server/utils/dailyClassCreation.js`:

```javascript
const PREDEFINED_SLOTS = [
  { time: '08:00', duration: 45, label: '8:00 AM - 8:45 AM' },
  // Add more slots as needed
  { time: '21:00', duration: 60, label: '9:00 PM - 10:00 PM' }
];
```

### Change Slot Duration

Modify slot creation request:

```javascript
{
  "date": "2026-06-05",
  "selectedSlots": [
    { "time": "09:00", "duration": 90 },  // 90 minutes instead of 60
  ]
}
```

### Add Meeting Links Automatically

Modify `dailyClassCreation.js` createDailySlots function:

```javascript
const newSlot = await Slot.create({
  // ... other fields
  meetingLink: `https://zoom.us/meeting/${generateMeetingId()}`,
  meetingPlatform: 'Zoom'
});
```

## Testing

### Manual Testing Checklist

- [ ] Create slots for today
- [ ] Create slots for future date
- [ ] Create bulk slots for 7 days
- [ ] Create custom time slot (non-standard time)
- [ ] Select all slots at once
- [ ] Deselect all slots
- [ ] Delete created slots
- [ ] Verify slots appear in student's booking view
- [ ] Test on mobile/tablet
- [ ] Test error cases (past date, no selection, etc.)

### API Testing (using curl/Postman)

```bash
# Get predefined slots
curl -X GET http://localhost:5000/api/slots/predefined/list

# Create slots
curl -X POST http://localhost:5000/api/slots/daily/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-06-05",
    "selectedSlots": [...]
  }'
```

## Performance Considerations

- ⚡ Uses MongoDB indexes on `coachId` and `date` fields
- 🔄 Implements caching for predefined slots
- 📊 Bulk creation queries optimized to reduce database roundtrips
- 🎯 Frontend lazy-loads slots only for selected date

## Future Enhancements

🚀 **Recurring Slots** - Create recurring slots for same time each week  
🚀 **Slot Templates** - Save and reuse slot configurations  
🚀 **Auto-Complete Sessions** - Automatically mark slots as completed  
🚀 **Calendar Integration** - Sync with Google Calendar / iCal  
🚀 **Time Zone Support** - Handle multiple time zones for international coaches  
🚀 **Slot Analytics** - Track booking rates and popular time slots  

## Troubleshooting

### Slots not appearing after creation
- ✅ Check that token is valid and not expired
- ✅ Verify coach ID is correct
- ✅ Check browser console for errors
- ✅ Verify MongoDB connection

### Cannot delete slots
- ✅ Ensure slots are not booked
- ✅ Check user authorization
- ✅ Verify correct date format

### Frontend component not showing
- ✅ Ensure component is imported in parent
- ✅ Check CSS file is linked
- ✅ Verify token is in localStorage
- ✅ Check network tab for API errors

## Support & Documentation

For more information:
- See `API_DOCUMENTATION.md` for full API reference
- See `FRONTEND_IMPLEMENTATION.md` for frontend setup
- Check `server/routes/slots.js` for route definitions
- Review `server/controllers/slotController.js` for controller logic
