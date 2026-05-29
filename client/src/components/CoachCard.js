import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CoachCard.css';

const CoachCard = ({ coach }) => {
  const navigate = useNavigate();

  // ⭐ Calculate lowest slot price
  const getLowestPrice = () => {
    if (!coach.slots || coach.slots.length === 0) return null;
    const prices = coach.slots.map(s => s.price);
    return Math.min(...prices);
  };

  const lowestPrice = getLowestPrice();

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star empty'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="coach-card" onClick={() => navigate(`/coach/${coach._id}`)}>

      {/* Avatar */}
      <div className="coach-avatar">
        <span>{coach.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Name & Title */}
      <div className="coach-header">
        <h3>{coach.name}</h3>

        {coach.title !== 'None' && (
          <p className="coach-title">{coach.title}</p>
        )}
      </div>

      {/* Info Section */}
      <div className="coach-info">
        <p><strong>Chess Rating:</strong> {coach.chessRating}</p>
        <p><strong>Experience:</strong> {coach.experience} years</p>
        <p><strong>Sessions:</strong> {coach.totalSessions || 0}</p>
      </div>

      {/* Rating Section */}
      {coach.averageRating > 0 && (
        <div className="coach-rating">
          <div className="stars">
            {renderStars(Math.round(coach.averageRating))}
          </div>
          <span className="rating-text">
            {coach.averageRating.toFixed(1)} ({coach.totalReviews} reviews)
          </span>
        </div>
      )}

      {/* Specializations */}
      {coach.specializations && coach.specializations.length > 0 && (
        <div className="coach-specializations">
          {coach.specializations.slice(0, 3).map((spec, i) => (
            <span className="spec-tag" key={i}>{spec}</span>
          ))}
        </div>
      )}

      {/* FIXED PRICE SECTION */}
      <div className="coach-price">
        <strong>Starts From:</strong>{" "}
        <span>
          {lowestPrice !== null ? `₹${lowestPrice}` : "No slots available"}
        </span>
      </div>

      {/* CTA Button */}
      <button className="coach-btn">
        View Profile
      </button>

    </div>
  );
};

export default CoachCard;