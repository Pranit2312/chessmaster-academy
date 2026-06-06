import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CourseCard.css';

const CourseCard = ({ course, onEnroll }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/course/${course._id}`);
  };

  const handleEnroll = (e) => {
    e.stopPropagation();
    onEnroll(course._id);
  };

  const renderRating = (rating) => {
    if (!rating) return null;
    return (
      <div className="course-rating">
        <span className="stars">{'⭐'.repeat(Math.floor(rating))}</span>
        <span className="rating-value">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="course-card" onClick={handleViewDetails}>
      <div className="course-image">
        <img 
          src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Chess+Course'} 
          alt={course.title}
        />
        <div className="course-difficulty">
          <span className={`badge difficulty-${course.difficulty?.toLowerCase()}`}>
            {course.difficulty}
          </span>
        </div>
      </div>
      
      <div className="course-content">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          {renderRating(course.rating)}
        </div>

        <p className="course-description">
          {course.shortDescription || course.description?.substring(0, 80)}...
        </p>

        <div className="course-info">
          <div className="info-item">
            <span className="label">Category:</span>
            <span className="value">{course.category}</span>
          </div>
          <div className="info-item">
            <span className="label">Students:</span>
            <span className="value">{course.enrollmentCount || 0}</span>
          </div>
          {course.duration && (
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{course.duration}h</span>
            </div>
          )}
        </div>

        <div className="course-footer">
          <div className="pricing">
            {course.pricing?.isFree ? (
              <span className="price-free">Free</span>
            ) : (
              <>
                <span className="price">₹{course.pricing?.price}</span>
                {course.pricing?.discountPercentage && (
                  <span className="discount">{course.pricing.discountPercentage}% OFF</span>
                )}
              </>
            )}
          </div>

          <button 
            className="btn-enroll"
            onClick={handleEnroll}
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
