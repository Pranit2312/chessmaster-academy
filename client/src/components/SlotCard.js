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

  return (
    <div className="slot-card">
      <div className="slot-header">
        <h4>{formatDate(slot.startTime)}</h4>
        <span className="slot-price">₹{slot.price}</span>
      </div>

      <p className="slot-time">
        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
      </p>

      <p className="slot-label">📅 {slot.duration} minutes</p>
      <p className="slot-label">📹 {slot.meetingPlatform}</p>

      <p className={`slot-status ${slot.status}`}>
        {slot.status}
      </p>

      {!isCoach && slot.status === "available" && (
        <button className="btn btn-primary" onClick={() => onBook(slot)}>
          Book Now
        </button>
      )}

      {isCoach && (
        <div className="slot-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onEdit(slot)}
            disabled={slot.isBooked}
          >
            Edit
          </button>

          {!slot.isBooked && (
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