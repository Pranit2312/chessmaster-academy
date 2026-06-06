# 🎯 Daily Class Creation - Quick Reference for Coaches

## ⚡ Quick Start (2 Minutes)

### Step 1: Navigate to Daily Class Creation
```
Coach Dashboard → Daily Class Creation
```

### Step 2: Select a Date
- Click the **date picker**
- Choose today or any future date
- Available time slots for that date will show

### Step 3: Select Time Slots
- ✅ Check the boxes for times you're available
- Or click **"Select All"** to choose all time slots
- **Default:** 9 AM to 9 PM (12 slots)

### Step 4: Create Slots
- Click **"✅ Create Slots"** button
- See confirmation message
- Slots are now **LIVE** and students can book!

---

## 📋 Common Tasks

### I want to open my slots for tomorrow
```
1. Select tomorrow's date
2. Check slots: 9 AM, 10 AM, 2 PM, 3 PM (example)
3. Click "Create Slots"
✅ Done! Students can now book these slots
```

### I want to open slots for the next 7 days
```
1. Toggle to "Multiple Days" mode
2. Set "Number of Days" to 7
3. Select time slots
4. Click "Create Slots"
✅ Your 7-day schedule is ready!
```

### I need custom hours (not standard times)
```
1. Click "✏️ Custom Time Slot"
2. Enter date: 2026-06-05
3. Enter time: 14:30 (2:30 PM)
4. Enter duration: 90 (minutes)
5. Click "Create"
✅ Custom slot created!
```

### I want to remove all slots for a date
```
1. Select the date
2. Click "🗑️ Delete All Slots"
3. Confirm when asked
⚠️ Note: Can't delete slots that are already booked
```

### I want to delete just one slot
```
1. Select the date
2. Find the slot in "Created Slots" section
3. Click delete icon next to it
✅ Slot removed!
```

---

## 🎯 Available Time Slots (By Default)

| Time | Label |
|------|-------|
| 9:00 AM | 9:00 AM - 10:00 AM |
| 10:00 AM | 10:00 AM - 11:00 AM |
| 11:00 AM | 11:00 AM - 12:00 PM |
| 12:00 PM | 12:00 PM - 1:00 PM |
| 1:00 PM | 1:00 PM - 2:00 PM |
| 2:00 PM | 2:00 PM - 3:00 PM |
| 3:00 PM | 3:00 PM - 4:00 PM |
| 4:00 PM | 4:00 PM - 5:00 PM |
| 5:00 PM | 5:00 PM - 6:00 PM |
| 6:00 PM | 6:00 PM - 7:00 PM |
| 7:00 PM | 7:00 PM - 8:00 PM |
| 8:00 PM | 8:00 PM - 9:00 PM |

💡 **Tip:** All slots are 60 minutes by default. Use "Custom Time Slot" for different durations.

---

## 💬 Common Questions & Answers

### Q: Can I create slots in the past?
❌ **No.** System prevents creating slots before today.

### Q: Can I book my own slots?
❌ **No.** As a coach, you create slots. Only students can book them.

### Q: Can I edit a slot after creating it?
✅ **Yes.** Delete it and create a new one with different details.

### Q: What if a student books my slot, can I delete it?
❌ **No.** You can't delete booked slots. Only unbooked slots can be deleted.

### Q: Can students see all my available slots?
✅ **Yes.** Once you create slots, they appear in the booking section for students.

### Q: Can I create recurring weekly slots?
⏳ **Currently:** Create slots manually for each week.  
🚀 **Soon:** Auto-recurring feature will be added.

### Q: What time zone is used?
📍 **Current:** Server time zone (configured in environment)  
🚀 **Soon:** Support for multiple time zones coming soon.

### Q: Can I bulk delete multiple dates?
⏳ **Currently:** Delete one date at a time.  
🚀 **Soon:** Bulk delete feature will be added.

### Q: What if I want 90-minute sessions instead of 60?
✅ **Use custom slot creation** with duration set to 90 minutes.

---

## 🔐 Important Security Notes

### Your Data is Protected By:
✅ **JWT Authentication** - Only you can access your account  
✅ **Role-Based Access** - Only coaches can create slots  
✅ **Ownership Verification** - You can only manage your own slots  
✅ **Encryption** - All data transmitted securely over HTTPS  

### Best Practices:
1. ✅ Keep your password strong
2. ✅ Don't share your auth token
3. ✅ Log out from shared devices
4. ✅ Update your profile regularly
5. ✅ Review your bookings weekly

---

## 📊 Status Indicators Explained

| Status | Meaning | Your Action |
|--------|---------|------------|
| 🟢 **Available** | Students can book this slot | Slot is active |
| 🔴 **Booked** | Student has already booked this slot | Cannot delete |
| ⏳ **Pending** | Student requested, awaiting confirmation | Can confirm/reject |
| ✅ **Completed** | Session has finished | Archived automatically |
| ⏱️ **Expired** | Date/time has passed | Auto-archived |

---

## 💡 Pro Tips

### Tip 1: Set Weekly Schedule
Create slots for the same times every week:
```
Monday:   9 AM, 2 PM, 6 PM
Tuesday:  10 AM, 3 PM
...etc
```

### Tip 2: Review Bookings Weekly
Check your calendar every Friday to plan next week

### Tip 3: Set Price Per Session
Add session price in custom slot creation for automatic charging

### Tip 4: Add Meeting Links
Include Zoom/Google Meet link in slot details for remote sessions

### Tip 5: Use Notes Section
Add session notes: "No beginners", "Advanced chess theory", etc.

### Tip 6: Keep Consistent Times
Students prefer coaches with consistent, predictable schedules

### Tip 7: Monitor Booking Rate
If slots always full → consider adding more slots  
If slots empty → consider different times or marketing

---

## 🚨 Troubleshooting

### Problem: Slots not created
**Solution:**
1. Refresh the page
2. Check if date is in the future
3. Check if you're logged in as a coach
4. Check browser console for errors

### Problem: Can't see "Create Slots" button
**Solution:**
1. Make sure you're logged in
2. Verify your role is "coach"
3. Check if slots are already created for that date
4. Clear browser cache and refresh

### Problem: Deleted slots reappeared
**Solution:**
1. Refresh the page to reload
2. Make sure you're viewing correct date
3. Check if slots were actually deleted

### Problem: Can't delete a slot
**Solution:**
- This slot is **booked** by a student
- Contact student or wait for session to complete
- Unbooked slots can always be deleted

---

## 📞 Getting Help

### Resources:
- 📖 Full Guide: `DAILY_CLASS_CREATION_GUIDE.md`
- 📋 Detailed Info: `DAILY_CLASS_CREATION_RESTORED.md`
- 🔌 API Docs: `API_DOCUMENTATION.md`

### Need Support?
- Check the troubleshooting section above
- Review the full guide
- Contact admin support

---

## 🎓 Example Daily Schedules

### Example 1: Part-time Coach (3 hours/day)
```
Monday:     9 AM, 10 AM, 2 PM
Tuesday:    Off
Wednesday:  3 PM, 4 PM, 5 PM
Thursday:   6 PM, 7 PM, 8 PM
Friday:     9 AM, 10 AM, 11 AM
Saturday:   2 PM, 3 PM, 4 PM
Sunday:     Off
```

### Example 2: Full-time Coach (6-8 hours/day)
```
Every Day:  9-11 AM (3 slots)
           1-3 PM (3 slots)
           6-8 PM (3 slots)
Total: 9 slots/day
```

### Example 3: Specialized Hours
```
Weekdays:   After 6 PM only
Weekends:   All day
Specialization: Adults only (add in notes)
```

---

## 📈 Growth Tracker

**Your Slot Statistics:**
- Total slots created: `[Updates real-time]`
- Slots booked this week: `[Updates real-time]`
- Booking rate: `[Percentage]`
- Average earnings: `[Calculated]`
- Student reviews: `[Rating]`

---

## ✅ Checklist for Today

- [ ] Create slots for today
- [ ] Create slots for tomorrow
- [ ] Set up recurring times for the week
- [ ] Add meeting link to first slot
- [ ] Review any pending bookings
- [ ] Update pricing if needed

---

**Last Updated:** June 1, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready

For more details, see the full guides in your project documentation!
