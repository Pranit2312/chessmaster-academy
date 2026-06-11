import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseAPI, enrollmentAPI, reviewAPI } from '../utils/api';
import '../styles/CourseDetailPage.css';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourseById(courseId);
      setCourse(response.data);
      
      // Fetch reviews
      const reviewsResponse = await reviewAPI.getReviews(courseId);
      setReviews(reviewsResponse.data || []);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const checkEnrollment = useCallback(async () => {
    try {
      const enrollments = await enrollmentAPI.getMyEnrollments();
      const enrolled = enrollments.data?.some(e => e.course?._id === courseId);
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
    checkEnrollment();
  }, [fetchCourseDetails, checkEnrollment]);

  const handleEnroll = async () => {
    try {
      if (course.pricing?.isFree) {
        setLoading(true);
        await enrollmentAPI.enrollInCourse({
          courseId,
          paymentMethod: 'free'
        });
        navigate('/my-courses');
      } else {
        // Handle paid course enrollment
        setLoading(true);
        const response = await enrollmentAPI.enrollInCourse({
          courseId,
          paymentMethod: 'razorpay'
        });

        const result = response.data?.data || {};
        const { orderId, amount, razorpayKeyId, enrollmentId } = result;

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
                navigate('/my-courses');
              } catch (error) {
                alert('Payment verification failed');
              }
            },
            prefill: {
              name: '',
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
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.message || 'Failed to enroll in course');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!course) return <div className="error">Course not found</div>;

  return (
    <div className="course-detail-page">
      <div className="course-hero">
        <img 
          src={course.thumbnail || 'https://via.placeholder.com/1200x400'} 
          alt={course.title}
          className="hero-image"
        />
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>{course.title}</h1>
            <p className="subtitle">{course.shortDescription}</p>
            <div className="course-meta">
              <span className="badge">{course.category}</span>
              <span className="badge">{course.difficulty}</span>
              <span className="rating">⭐ {course.rating || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="course-detail-container">
        <div className="course-main">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
              onClick={() => setActiveTab('curriculum')}
            >
              Curriculum
            </button>
            <button 
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({reviews.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <h2>About this course</h2>
                <p>{course.description}</p>

                <h3>What you'll learn</h3>
                <ul className="objectives-list">
                  {course.objectives?.map((obj, idx) => (
                    <li key={idx}>✓ {obj}</li>
                  ))}
                </ul>

                {course.prerequisites && course.prerequisites.length > 0 && (
                  <>
                    <h3>Prerequisites</h3>
                    <ul className="prerequisites-list">
                      {course.prerequisites.map((prereq, idx) => (
                        <li key={idx}>{prereq}</li>
                      ))}
                    </ul>
                  </>
                )}

                <h3>Course Info</h3>
                <div className="course-stats">
                  <div className="stat">
                    <span className="label">Instructor:</span>
                    <span className="value">{course.instructor?.name}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Language:</span>
                    <span className="value">{course.language}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Students:</span>
                    <span className="value">{course.enrollmentCount}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div className="curriculum-tab">
                <h2>Course Curriculum</h2>
                {course.chapters?.map((chapter) => (
                  <div key={chapter._id} className="chapter">
                    <h3>📚 {chapter.title}</h3>
                    <p>{chapter.description}</p>
                    <div className="lessons">
                      {chapter.lessons?.map((lesson) => (
                        <div key={lesson._id} className="lesson">
                          <span className="lesson-title">
                            📹 {lesson.title}
                          </span>
                          <span className="lesson-duration">
                            {lesson.duration}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <h2>Student Reviews</h2>
                {reviews.length > 0 ? (
                  <div className="reviews-list">
                    {reviews.map((review) => (
                      <div key={review._id} className="review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{review.student?.name}</span>
                          <span className="review-rating">
                            {'⭐'.repeat(Math.min(5, Math.max(0, Number(review.rating) || 0)))}
                          </span>
                        </div>
                        <p className="review-text">{review.text}</p>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="course-sidebar">
          <div className="course-card-sidebar">
            <div className="pricing-section">
              {course.pricing?.isFree ? (
                <p className="price-free">Free Course</p>
              ) : (
                <>
                  <p className="price">₹{course.pricing?.price}</p>
                  {course.pricing?.discountPercentage && (
                    <p className="discount">
                      {course.pricing.discountPercentage}% OFF
                    </p>
                  )}
                </>
              )}
            </div>

            {isEnrolled ? (
              <button 
                className="btn-primary btn-block"
                onClick={() => navigate(`/course/${courseId}/learn`)}
              >
                Continue Learning
              </button>
            ) : (
              <button 
                className="btn-primary btn-block"
                onClick={handleEnroll}
              >
                Enroll Now
              </button>
            )}

            <div className="course-includes">
              <h4>This course includes:</h4>
              <ul>
                <li>📚 {course.chapters?.length || 0} Chapters</li>
                <li>🎥 {course.lessonsCount || 0} Video Lessons</li>
                <li>⏱️ {course.totalDuration || 0}+ hours of content</li>
                <li>📜 Certificate of Completion</li>
                <li>♾️ Lifetime Access</li>
              </ul>
            </div>

            <div className="instructor-info">
              <h4>About the Instructor</h4>
              <div className="instructor">
                <img 
                  src={course.instructor?.profilePicture} 
                  alt={course.instructor?.name}
                  className="instructor-avatar"
                />
                <div>
                  <p className="instructor-name">{course.instructor?.name}</p>
                  <p className="instructor-bio">{course.instructor?.bio}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetailPage;
