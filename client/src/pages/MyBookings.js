import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, reviewAPI } from '../utils/api';
import BookingCard from '../components/BookingCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/Bookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    teachingQuality: 5,
    communication: 5,
    punctuality: 5,
    wouldRecommend: true
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await bookingAPI.getMyBookings();
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancelBooking(bookingId, {
          cancellationReason: 'Student cancelled'
        });
        fetchBookings();
      } catch (error) {
        alert('Failed to cancel booking');
      }
    }
  };

  const handleReview = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.createReview({
        bookingId: selectedBooking._id,
        ...reviewData
      });
      setShowReviewModal(false);
      setSelectedBooking(null);
      fetchBookings();
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bookings-container">
      <h2>My Bookings</h2>
      <p>View and manage your coaching sessions</p>

      {/* Booking List */}
      {bookings.length > 0 ? (
        <div className="booking-list">
          {bookings.map(booking => (
            <BookingCard
              key={booking._id}
              booking={booking}
              isCoach={false}
              onCancel={handleCancel}
              onReview={handleReview}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't booked any sessions yet</p>
          <Link to="/browse" className="btn btn-primary">Browse Coaches</Link>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Write a Review</h3>

            <form onSubmit={handleReviewSubmit}>

              {/* Overall Rating */}
              <label>Overall Rating</label>
              <select
                className="form-select"
                value={reviewData.rating}
                onChange={(e) => setReviewData({ ...reviewData, rating: Number(e.target.value) })}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Below Average</option>
                <option value={1}>1 - Poor</option>
              </select>

              {/* Teaching Quality */}
              <label>Teaching Quality</label>
              <select
                className="form-select"
                value={reviewData.teachingQuality}
                onChange={(e) => setReviewData({ ...reviewData, teachingQuality: Number(e.target.value) })}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Below Average</option>
                <option value={1}>1 - Poor</option>
              </select>

              {/* Communication */}
              <label>Communication</label>
              <select
                className="form-select"
                value={reviewData.communication}
                onChange={(e) => setReviewData({ ...reviewData, communication: Number(e.target.value) })}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Below Average</option>
                <option value={1}>1 - Poor</option>
              </select>

              {/* Punctuality */}
              <label>Punctuality</label>
              <select
                className="form-select"
                value={reviewData.punctuality}
                onChange={(e) => setReviewData({ ...reviewData, punctuality: Number(e.target.value) })}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Below Average</option>
                <option value={1}>1 - Poor</option>
              </select>

              {/* Comment */}
              <label>Your Review</label>
              <textarea
                className="form-textarea"
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience..."
                required
              />

              {/* Recommend */}
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  checked={reviewData.wouldRecommend}
                  onChange={(e) => setReviewData({ ...reviewData, wouldRecommend: e.target.checked })}
                />
                <span>I would recommend this coach</span>
              </div>

              {/* Buttons */}
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-secondary">
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary">
                  Submit Review
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;