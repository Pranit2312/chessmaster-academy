import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { enrollmentAPI, certificateAPI } from '../utils/api';
import '../styles/MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    try {
      setLoading(true);
      const response = await enrollmentAPI.getMyEnrollments();
      setEnrollments(response.data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/course/${courseId}/learn`);
  };

  const handleDownloadCertificate = async (enrollmentId) => {
    try {
      await certificateAPI.downloadCertificate(enrollmentId);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  const getFilteredEnrollments = () => {
    return enrollments.filter(enrollment => {
      if (filter === 'completed') {
        return enrollment.status === 'completed';
      } else if (filter === 'in-progress') {
        return enrollment.status === 'in-progress';
      }
      return true;
    });
  };

  const filteredEnrollments = getFilteredEnrollments();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="my-courses-page">
      <div className="page-header">
        <h1>My Courses</h1>
        <p>Continue learning and track your progress</p>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({enrollments.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({enrollments.filter(e => e.status === 'in-progress').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({enrollments.filter(e => e.status === 'completed').length})
        </button>
      </div>

      {filteredEnrollments.length > 0 ? (
        <div className="courses-grid">
          {filteredEnrollments.map(enrollment => (
            <EnrollmentCard
              key={enrollment._id}
              enrollment={enrollment}
              onContinue={handleContinueLearning}
              onDownloadCertificate={handleDownloadCertificate}
            />
          ))}
        </div>
      ) : (
        <div className="no-courses">
          <p>No courses found</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/courses')}
          >
            Explore Courses
          </button>
        </div>
      )}
    </div>
  );
};

const EnrollmentCard = ({ enrollment, onContinue, onDownloadCertificate }) => {
  const { course, progress, status, enrolledDate } = enrollment;

  const getStatusColor = () => {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      default: return 'status-pending';
    }
  };

  return (
    <div className="enrollment-card">
      <div className="card-image">
        <img 
          src={course.thumbnail} 
          alt={course.title}
        />
        <span className={`status-badge ${getStatusColor()}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="card-content">
        <h3>{course.title}</h3>
        <p className="course-instructor">
          By {course.instructor?.name}
        </p>

        <div className="progress-section">
          <div className="progress-info">
            <span>Progress</span>
            <span>{progress?.progressPercentage || 0}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress?.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="label">Lessons Completed</span>
            <span className="value">
              {progress?.completedLessons?.length || 0} / {progress?.totalLessons || 0}
            </span>
          </div>
          <div className="stat">
            <span className="label">Enrolled</span>
            <span className="value">
              {new Date(enrolledDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="card-actions">
          {status === 'completed' ? (
            <>
              <button 
                className="btn-primary"
                onClick={() => onContinue(course._id)}
              >
                Review Course
              </button>
              {enrollment.certificate && (
                <button 
                  className="btn-secondary"
                  onClick={() => onDownloadCertificate(enrollment._id)}
                >
                  📜 Download Certificate
                </button>
              )}
            </>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => onContinue(course._id)}
            >
              Continue Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCoursesPage;
