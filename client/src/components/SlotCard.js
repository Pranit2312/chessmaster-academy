import React from "react";
import "../styles/SlotCard.css";

const SlotCard = ({ slot, isCoach, onEdit, onDelete, onBook }) => {

  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const capacity = slot.capacity || 1;
  const bookedCount = slot.currentBookings || 0;
  const remainingSpots = slot.remainingSpots ?? Math.max(0, capacity - bookedCount);
  const isFull = remainingSpots <= 0;

  return (
    <div className="slot-card">
      <div className="slot-header">
        <h4>{formatDate(slot.startTime)}</h4>
        <span className="slot-price">₹{slot.price}</span>
      </div>

      <p className="slot-time">
        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
      </p>

      <p className="slot-label">{slot.duration} minutes</p>
      <p className="slot-label">{slot.meetingPlatform}</p>

      {capacity > 1 ? (
        <p className={`slot-spots ${remainingSpots > 0 ? 'spots-available' : 'spots-full'}`}>
          {remainingSpots > 0 ? `${remainingSpots} / ${capacity} spots left` : 'Fully booked'}
        </p>
      ) : (
        <p className={`slot-status ${slot.status}`}>
          {slot.status}
        </p>
      )}

      {!isCoach && slot.status === "available" && !isFull && (
        <button className="btn btn-primary" onClick={() => onBook(slot)}>
          {capacity > 1 ? `Join (${remainingSpots} left)` : 'Book Now'}
        </button>
      )}

      {isCoach && (
        <div className="slot-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onEdit(slot)}
            disabled={slot.isBooked || slot.currentBookings > 0}
          >
            Edit
          </button>

          {!slot.isBooked && slot.currentBookings === 0 && (
            <button
              className="btn btn-danger"
              onClick={() => onDelete(slot._id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SlotCard;