import React from 'react';
import { format } from 'date-fns';
import '../styles/BookingCard.css';

const BookingCard = ({ booking, isCoach, onCancel, onComplete, onReview }) => {

  const formatDate = (date) =>
    date ? format(new Date(date), 'MMM dd, yyyy hh:mm a') : 'N/A';

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      'no-show': 'badge-warning'
    };
    return badges[status] || 'badge-info';
  };

  const otherUser = isCoach ? booking.student : booking.coach;

  // ✅ SAFETY: meetingLink can be on booking OR slot
  const meetingLink = booking.meetingLink || booking.slot?.meetingLink;

  return (
    <div className="booking-card">

      {/* HEADER */}
      <div className="booking-header">
        <h3>{otherUser?.name}</h3>
        <p>Chess Rating: {otherUser?.chessRating}</p>

        <span className={`badge ${getStatusBadge(booking.sessionStatus)}`}>
          {booking.sessionStatus}
        </span>
      </div>

      {/* DETAILS */}
      <div className="booking-details">
        <p><strong>Date & Time:</strong> {formatDate(booking.slot?.startTime)}</p>
        <p><strong>Duration:</strong> {booking.slot?.duration} minutes</p>
        <p><strong>Amount:</strong> ₹{booking.amount}</p>

        <p>
          <strong>Payment:</strong>{" "}
          <span
            className={`badge badge-${
              (booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') ? 'success' : 'warning'
            }`}
          >
            {booking.paymentStatus}
          </span>
        </p>
      </div>

      {/* JOIN MEETING */}
      {meetingLink && (booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') && (
        <div className="meeting-section">
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block"
          >
            Join Meeting
          </a>
        </div>
      )}

      {/* ACTIONS */}
      {booking.sessionStatus === 'scheduled' && (
        <div className="booking-actions">

          {isCoach && (
            <button
              onClick={() => onComplete?.(booking._id)}
              className="btn btn-success"
            >
              Mark Complete
            </button>
          )}

          {/* ✅ IMPORTANT: no form submit, pure click */}
          <button
            type="button"
            onClick={() => onCancel?.(booking._id)}
            className="btn btn-danger"
          >
            Cancel
          </button>

        </div>
      )}

      {/* REVIEW */}
      {booking.sessionStatus === 'completed' && !isCoach && (
        <button
          onClick={() => onReview?.(booking)}
          className="btn btn-primary btn-block"
        >
          Write Review
        </button>
      )}
    </div>
  );
};

export default BookingCard;