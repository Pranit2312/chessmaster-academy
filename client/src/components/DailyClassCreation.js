import React, { useState, useEffect } from 'react';
import { slotAPI } from '../utils/api';
import '../styles/DailyClassCreation.css';

/**
 * DailyClassCreation Component
 * Allows coaches to manually create daily available time slots
 */
const DailyClassCreation = ({ coachId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [predefinedSlots, setPredefinedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dailySlots, setDailySlots] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('Zoom');
  const [fee, setFee] = useState('');

  // Fetch predefined slots template on mount
  useEffect(() => {
    fetchPredefinedSlots();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailySlotsForDate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchPredefinedSlots = async () => {
    try {
      const response = await slotAPI.getPredefinedSlots();
      setPredefinedSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching predefined slots:', error);
    }
  };

  const fetchDailySlotsForDate = async () => {
    try {
      const response = await slotAPI.getDailySlotsForDate(selectedDate);
      setDailySlots(response.data.slots || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching daily slots:', error);
      }
      setDailySlots([]);
    }
  };

  const handleSlotToggle = (index) => {
    if (selectedSlots.includes(index)) {
      setSelectedSlots(selectedSlots.filter(i => i !== index));
    } else {
      setSelectedSlots([...selectedSlots, index]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSlots.length === predefinedSlots.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(predefinedSlots.map((_, i) => i));
    }
  };

  const handleCreateSlots = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (selectedSlots.length === 0) {
        setErrorMessage('Please select at least one time slot');
        setLoading(false);
        return;
      }

      if (!meetingLink) {
        setErrorMessage('Please provide a meeting link (Zoom/Meet/etc.)');
        setLoading(false);
        return;
      }

      if (fee === '' || Number(fee) < 0) {
        setErrorMessage('Please provide a valid fee amount');
        setLoading(false);
        return;
      }

      const slotsToCreate = selectedSlots.map(index => predefinedSlots[index]);

      const payload = bulkMode
        ? {
            startDate: selectedDate,
            numberOfDays,
            selectedSlots: slotsToCreate,
            meetingLink,
            meetingPlatform,
            fee
          }
        : {
            date: selectedDate,
            selectedSlots: slotsToCreate,
            meetingLink,
            meetingPlatform,
            fee
          };

      const response = bulkMode 
        ? await slotAPI.createBulkDailySlots(payload)
        : await slotAPI.createDailySlots(payload);

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setSelectedSlots([]);
        setTimeout(() => {
          fetchDailySlotsForDate();
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error creating slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDailySlots = async () => {
    if (!window.confirm('Are you sure you want to delete all slots for this date?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await slotAPI.deleteDailySlots(selectedDate);

      if (response.data.success) {
        setSuccessMessage('Slots deleted successfully');
        setDailySlots([]);
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error deleting slots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="daily-class-creation-container">
      <div className="dcc-header">
        <h2>📅 Daily Class Creation</h2>
        <p>Manually set up your available coaching slots</p>
      </div>

      {/* Messages */}
      {successMessage && <div className="dcc-success-message">{successMessage}</div>}
      {errorMessage && <div className="dcc-error-message">{errorMessage}</div>}

      <div className="dcc-content">
        {/* Mode Toggle */}
        <div className="dcc-mode-toggle">
          <label>
            <input
              type="radio"
              name="mode"
              checked={!bulkMode}
              onChange={() => setBulkMode(false)}
            />
            Single Day
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={bulkMode}
              onChange={() => setBulkMode(true)}
            />
            Multiple Days
          </label>
        </div>

        {/* Date Selection */}
        <div className="dcc-date-selection">
          <label htmlFor="date">Select Date</label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={bulkMode}
          />
        </div>

        {/* Meeting Details */}
        <div className="dcc-meeting-details">
          <div className="dcc-form-group">
            <label htmlFor="fee">Fee (₹) *</label>
            <input
              id="fee"
              type="number"
              min="0"
              placeholder="e.g., 500"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="dcc-input"
              required
            />
          </div>
          <div className="dcc-form-group">
            <label htmlFor="meetingLink">Meeting Link (Zoom/Google Meet/etc.) *</label>
            <input
              id="meetingLink"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="dcc-input"
              required
            />
          </div>
          <div className="dcc-form-group">
            <label htmlFor="meetingPlatform">Platform</label>
            <select
              id="meetingPlatform"
              value={meetingPlatform}
              onChange={(e) => setMeetingPlatform(e.target.value)}
              className="dcc-select"
            >
              <option value="Zoom">Zoom</option>
              <option value="Google Meet">Google Meet</option>
              <option value="Microsoft Teams">Microsoft Teams</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Bulk Days (if bulk mode) */}
        {bulkMode && (
          <div className="dcc-bulk-days">
            <label htmlFor="numberOfDays">Number of Days</label>
            <input
              id="numberOfDays"
              type="number"
              min="1"
              max="30"
              value={numberOfDays}
              onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <span className="dcc-info">
              Will create slots from {selectedDate} to the next {numberOfDays} days
            </span>
          </div>
        )}

        {/* Time Slots Selection */}
        <div className="dcc-slots-selection">
          <div className="dcc-slots-header">
            <h3>Select Time Slots</h3>
            <button
              className="dcc-select-all-btn"
              onClick={handleSelectAll}
              type="button"
            >
              {selectedSlots.length === predefinedSlots.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="dcc-slots-grid">
            {predefinedSlots.map((slot, index) => (
              <label key={index} className="dcc-slot-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSlots.includes(index)}
                  onChange={() => handleSlotToggle(index)}
                />
                <span className="dcc-slot-label">{slot.label}</span>
                <span className="dcc-slot-duration">{slot.duration} min</span>
              </label>
            ))}
          </div>

          <div className="dcc-selection-summary">
            Selected: <strong>{selectedSlots.length} slots</strong> out of{' '}
            <strong>{predefinedSlots.length} available</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dcc-actions">
          <button
            className="dcc-create-btn"
            onClick={handleCreateSlots}
            disabled={loading || selectedSlots.length === 0}
          >
            {loading ? '⏳ Creating...' : '✅ Create Slots'}
          </button>
          {dailySlots.length > 0 && (
            <button
              className="dcc-delete-btn"
              onClick={handleDeleteDailySlots}
              disabled={loading}
            >
              {loading ? '⏳ Deleting...' : '🗑️ Delete All Slots'}
            </button>
          )}
        </div>

        {/* Daily Slots Display */}
        {dailySlots.length > 0 && (
          <div className="dcc-daily-slots-display">
            <h3>Created Slots for {selectedDate}</h3>
            <div className="dcc-slots-list">
              {dailySlots.map((slot) => (
                <div key={slot._id} className="dcc-slot-item">
                  <span className="dcc-slot-time">
                    {new Date(slot.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="dcc-slot-duration">{slot.duration} min</span>
                  <span
                    className={`dcc-slot-status dcc-status-${slot.status}`}
                  >
                    {slot.isBooked ? '🔴 Booked' : '🟢 Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="dcc-info-box">
          <h4>💡 How to Use</h4>
          <ul>
            <li>Select the date for which you want to create slots</li>
            <li>Choose the time slots from the predefined list</li>
            <li>Click "Create Slots" to make them available for booking</li>
            <li>Students can book these slots directly</li>
            <li>You can delete all unbooked slots anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyClassCreation;
