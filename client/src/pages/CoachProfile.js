import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { userAPI, slotAPI, reviewAPI, paymentAPI, bookingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SlotCard from '../components/SlotCard';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CoachProfile.css';

const CoachProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [coach, setCoach] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ bookingSlot now used properly
  const [bookingSlot, setBookingSlot] = useState(
    location.state?.selectedSlot || null
  );

  // ⭐ NEW STATE
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const fetchCoachData = async () => {
    try {
      const [coachRes, slotsRes, reviewsRes] = await Promise.all([
        userAPI.getCoachById(id),
        slotAPI.getSlots({ coachId: id }),
        reviewAPI.getCoachReviews(id)
      ]);

      setCoach(coachRes.data.coach);
      setSlots(slotsRes.data.slots);
      setReviews(reviewsRes.data.reviews);
    } catch (error) {
      console.error('Error fetching coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
    // eslint-disable-next-line
  }, [id]);

  // ⭐ BOOKING ENTRY POINT (updated)
  const handleBookSlot = (slot) => {
    if (!user) {
      alert('Please login to book a session');
      return;
    }

    setBookingSlot(slot);
    setShowPaymentOptions(true);
  };

  // ⭐ WALLET BOOKING HANDLER (NEW)
  const handleWalletPayment = async () => {
    try {
      if (!bookingSlot) {
        alert("No slot selected");
        return;
      }

      await bookingAPI.createBooking({
        slotId: bookingSlot._id
      });

      alert("Booking successful using wallet!");
      setShowPaymentOptions(false);
      setBookingSlot(null);
      fetchCoachData();

    } catch (error) {
      alert(error.response?.data?.message || "Wallet booking failed");
      console.error(error);
    }
  };

  // ⭐ RAZORPAY BOOKING HANDLER (UPDATED & FIXED)
  const handleRazorpayPayment = async () => {
    try {
      if (!bookingSlot) {
        alert("No slot selected");
        return;
      }

      const { data } = await paymentAPI.createOrder({
        slotId: bookingSlot._id,
        amount: bookingSlot.price
      });

      if (!data.orderId) {
        alert("Failed to initiate payment (Order ID missing)");
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ChessMaster Academy",
        description: `Booking with ${coach.name}`,
        order_id: data.orderId,

        handler: async function (response) {
          try {
            await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: data.bookingId
            });

            alert("Booking successful!");
            fetchCoachData();
            setBookingSlot(null);
            setShowPaymentOptions(false);

          } catch (error) {
            alert("Payment verification failed");
            console.error(error);
          }
        },

        prefill: {
          name: user.name,
          email: user.email
        },

        theme: { color: "#2563eb" }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      alert("Failed to initiate payment");
      console.error("Payment error:", error);
    }
  };

  // ⭐ STAR RENDERING (unchanged)
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

  if (loading) return <LoadingSpinner />;
  if (!coach) return <div>Coach not found</div>;

  return (
    <div className="coach-profile-container">

      {/** ⭐ NEW PAYMENT MODAL */}
      {showPaymentOptions && (
        <div className="payment-modal">
          <div className="payment-box">
            <h2 className="payment-title">Select Payment Method</h2>

            <button className="wallet-btn" onClick={handleWalletPayment}>
              💰Pay Using Wallet
            </button>

            <button className="razorpay-btn" onClick={handleRazorpayPayment}>
              💳Pay Online (Razorpay)
            </button>

            {/* CLOSE MODAL */}
            <button className="close-btn" onClick={() => setShowPaymentOptions(false)}>
              ✖ Cancel
            </button>
          </div>
        </div>
      )}

      <div className="coach-header">
        <div className="coach-avatar">
          {coach.name.charAt(0).toUpperCase()}
        </div>

        <div className="coach-info">
          <h2>{coach.name}</h2>

          {coach.title !== 'None' && (
            <p className="coach-title">{coach.title}</p>
          )}

          <div className="coach-stats">
            <p><strong>Chess Rating:</strong> {coach.chessRating}</p>
            <p><strong>Experience:</strong> {coach.experience} years</p>
            <p><strong>Sessions:</strong> {coach.totalSessions || 0}</p>
            <p><strong>Hourly Rate:</strong> ₹{coach.hourlyRate}</p>
          </div>

          {coach.averageRating > 0 && (
            <div className="coach-rating">
              <div className="stars">
                {renderStars(Math.round(coach.averageRating))}
              </div>
              <p className="rating-value">
                {coach.averageRating.toFixed(1)} ({coach.totalReviews} reviews)
              </p>
            </div>
          )}
        </div>
      </div>

      {coach.bio && (
        <section className="coach-section">
          <h3>About Me</h3>
          <p>{coach.bio}</p>
        </section>
      )}

      {coach.specializations?.length > 0 && (
        <section className="coach-section">
          <h3>Specializations</h3>
          <div className="specializations-list">
            {coach.specializations.map((spec, index) => (
              <span key={index} className="spec-tag">{spec}</span>
            ))}
          </div>
        </section>
      )}

      <section className="coach-section">
        <h3>Available Time Slots</h3>

        {slots.length > 0 ? (
          <div className="slot-grid">
            {slots.map(slot => (
              <SlotCard
                key={slot._id}
                slot={slot}
                isCoach={false}
                onBook={handleBookSlot}
              />
            ))}
          </div>
        ) : (
          <p>No available slots at the moment</p>
        )}
      </section>

      <section className="coach-section">
        <h3>Reviews ({reviews.length})</h3>

        {reviews.length > 0 ? (
          <div className="review-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <strong>{review.student?.name}</strong>
                  <div className="review-stars">
                    {renderStars(review.rating)}
                  </div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="review-comment">{review.comment}</p>

                {review.wouldRecommend && (
                  <span className="recommend-badge">Recommends</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No reviews yet</p>
        )}
      </section>
    </div>
  );
};

export default CoachProfile;