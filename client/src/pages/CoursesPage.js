import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { courseAPI, enrollmentAPI } from '../utils/api';
import '../styles/CoursesPage.css';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
    sortBy: 'newest'
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAllCourses({
        ...filters,
        q: filters.search
      });
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  const handleEnroll = async (courseId) => {
    try {
      const course = courses.find(c => c._id === courseId);
      
      if (course.pricing?.isFree) {
        // Enroll directly for free courses
        setEnrolling(true);
        await enrollmentAPI.enrollInCourse({
          courseId,
          paymentMethod: 'free'
        });
        setEnrolling(false);
        navigate('/my-courses');
      } else {
        // Show payment modal for paid courses
        setSelectedCourse(course);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    }
  };

  const handlePaymentSuccess = async () => {
    navigate('/my-courses');
  };

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Explore Chess Courses</h1>
        <p>Learn from experienced coaches and improve your chess skills</p>
      </div>

      <div className="courses-container">
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search courses..."
              name="search"
              value={filters.search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Openings">Openings</option>
              <option value="Tactics">Tactics</option>
              <option value="Strategy">Strategy</option>
              <option value="Endgames">Endgames</option>
              <option value="Puzzles">Puzzles</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Difficulty</label>
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </aside>

        <main className="courses-grid">
          {loading || enrolling ? (
            <LoadingSpinner />
          ) : courses.length > 0 ? (
            <div className="grid">
              {courses.map(course => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEnroll={handleEnroll}
                />
              ))}
            </div>
          ) : (
            <div className="no-courses">
              <p>No courses found</p>
              <button 
                className="btn-primary"
                onClick={() => setFilters({ category: '', difficulty: '', search: '', sortBy: 'newest' })}
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {showPaymentModal && selectedCourse && (
        <PaymentModal
          course={selectedCourse}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create enrollment/order for course
      const response = await enrollmentAPI.enrollInCourse({
        courseId: course._id,
        paymentMethod: 'razorpay'
      });

      const { orderId, amount, razorpayKeyId, enrollmentId } = response.data.data;

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: razorpayKeyId,
          amount: amount * 100,
          currency: 'INR',
          name: course.title,
          description: 'Course Enrollment',
          order_id: orderId,
          handler: async (response) => {
            // Verify payment
            try {
              await enrollmentAPI.verifyPayment({
                enrollmentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
              onSuccess();
            } catch (error) {
              alert('Payment verification failed');
            }
          },
          prefill: {
            name: '', // Will be filled by user in Razorpay UI or can be passed from auth
            email: ''
          },
          theme: {
            color: '#2563eb'
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <div className="payment-modal">
        <h2>Enroll in {course.title}</h2>
        <p className="course-price">₹{course.pricing.price}</p>
        
        <div className="payment-method-select">
          <label>
            <input
              type="radio"
              name="payment"
              value="razorpay"
              checked={paymentMethod === 'razorpay'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Razorpay (Credit/Debit Card, UPI)
          </label>
          <label>
            <input
              type="radio"
              name="payment"
              value="wallet"
              checked={paymentMethod === 'wallet'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Wallet Balance
          </label>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CoursesPage;
