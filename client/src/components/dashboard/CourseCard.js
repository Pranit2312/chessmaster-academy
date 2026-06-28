import React from 'react';
import './CourseCard.css';

const CourseCard = ({ course, onContinue }) => {
  if (!course) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue && course.id) {
      onContinue(course.id);
    }
  };

  return (
    <div className="course-card">
      <div className="course-thumbnail">
        <div className="thumbnail-placeholder">
          <span className="placeholder-icon">📚</span>
        </div>
        <div className="course-badge">{course.level || 'Beginner'}</div>
      </div>

      <div className="course-content">
        <h3 className="course-title">{course.name}</h3>
        
        <div className="course-meta">
          <span className="meta-item">
            <span className="meta-icon">📖</span>
            {course.lessons || 12} Lessons
          </span>
          <span className="meta-item">
            <span className="meta-icon">⏱️</span>
            {course.duration || '4h 30m'}
          </span>
        </div>

        <div className="course-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${course.progress || 45}%` }} 
            />
          </div>
          <span className="progress-text">{course.progress || 45}% Complete</span>
        </div>

        <button className="btn btn-primary btn-block" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
