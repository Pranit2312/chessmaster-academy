# Chess Learning Ecosystem - Frontend Implementation Guide

## FOLDER STRUCTURE

```
client/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── index.js
│   ├── App.js
│   ├── App.css
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── ErrorBoundary.js
│   │   │   └── Modal.js
│   │   │
│   │   ├── courses/
│   │   │   ├── CourseCard.js
│   │   │   ├── CourseFilters.js
│   │   │   ├── CourseGrid.js
│   │   │   ├── CourseDetails.js
│   │   │   ├── CoursePreview.js
│   │   │   └── CourseBreadcrumb.js
│   │   │
│   │   ├── courseBuilder/
│   │   │   ├── CourseCreatorWizard.js
│   │   │   ├── BasicInfoStep.js
│   │   │   ├── CurriculumStep.js
│   │   │   ├── MediaUploadStep.js
│   │   │   ├── PricingStep.js
│   │   │   └── ReviewStep.js
│   │   │
│   │   ├── videoPlayer/
│   │   │   ├── VideoPlayer.js
│   │   │   ├── VideoControls.js
│   │   │   ├── PlaybackSpeed.js
│   │   │   ├── Subtitles.js
│   │   │   └── ProgressBar.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.js
│   │   │   ├── CoachDashboard.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ProgressTracker.js
│   │   │   ├── AnalyticsWidget.js
│   │   │   └── RevenueChart.js
│   │   │
│   │   ├── enrollment/
│   │   │   ├── CheckoutModal.js
│   │   │   ├── PaymentForm.js
│   │   │   ├── OrderSummary.js
│   │   │   └── EnrollmentSuccess.js
│   │   │
│   │   ├── forum/
│   │   │   ├── DiscussionList.js
│   │   │   ├── DiscussionThread.js
│   │   │   ├── ReplyForm.js
│   │   │   └── SearchDiscussions.js
│   │   │
│   │   └── certificates/
│   │       ├── CertificatePreview.js
│   │       ├── CertificateDownload.js
│   │       └── VerifyCertificate.js
│   │
│   ├── pages/
│   │   ├── Home.js
│   │   ├── CourseMarketplace.js
│   │   ├── CourseDetailsPage.js
│   │   ├── StudentDashboardPage.js
│   │   ├── CoachDashboardPage.js
│   │   ├── CourseCreatorPage.js
│   │   ├── LearningPage.js
│   │   ├── MyCoursesPage.js
│   │   ├── ForumPage.js
│   │   ├── CertificatesPage.js
│   │   └── AdminPage.js
│   │
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── CourseContext.js
│   │   ├── EnrollmentContext.js
│   │   └── UIContext.js
│   │
│   ├── hooks/
│   │   ├── useFetch.js
│   │   ├── useAuth.js
│   │   ├── useCourse.js
│   │   ├── useProgress.js
│   │   └── useDebounce.js
│   │
│   ├── utils/
│   │   ├── api.js
│   │   ├── localStorage.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── helpers.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── enrollmentService.js
│   │   ├── progressService.js
│   │   └── paymentService.js
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   ├── components.css
│   │   ├── pages.css
│   │   └── responsive.css
│   │
│   └── __tests__/
│       ├── components/
│       ├── pages/
│       ├── utils/
│       └── services/
│
├── package.json
└── .env.example
```

---

## KEY COMPONENTS

### 1. Course Marketplace Page

```javascript
// client/src/pages/CourseMarketplace.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CourseCard from '../components/courses/CourseCard';
import CourseFilters from '../components/courses/CourseFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/CourseMarketplace.css';

const CourseMarketplace = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    priceRange: [0, 10000],
    isFree: null,
    search: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      setCourses(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
      setError(null);
    } catch (err) {
      setError('Failed to fetch courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <h1>Chess Course Marketplace</h1>
        <p>Learn from the best chess coaches in the world</p>
      </header>

      <div className="marketplace-content">
        {/* Sidebar Filters */}
        <aside className="marketplace-sidebar">
          <CourseFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Main Content */}
        <main className="marketplace-main">
          {/* Results Info */}
          <div className="results-info">
            <span>{pagination.total} courses found</span>
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : courses.length > 0 ? (
            <>
              <div className="courses-grid">
                {courses.map(course => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                    page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={pagination.page === page ? 'active' : ''}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-courses">
              <p>No courses found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseMarketplace;
```

### 2. Video Player Component

```javascript
// client/src/components/videoPlayer/VideoPlayer.js
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/hls';
import axios from 'axios';
import VideoControls from './VideoControls';
import ProgressBar from './ProgressBar';
import '../styles/VideoPlayer.css';

const VideoPlayer = ({ lessonId, videoUrl, duration, onProgress }) => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration_seconds, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (playing) setShowControls(false);
      }, 3000);
    };

    if (playing) {
      containerRef.current?.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout.current);
    };
  }, [playing]);

  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (playing && progress > 0) {
        try {
          await axios.post(`/api/progress/${lessonId}/update`, {
            watchedDuration: Math.round(progress * duration_seconds)
          });
          
          if (onProgress) {
            onProgress(progress);
          }
        } catch (error) {
          console.error('Error saving progress:', error);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [playing, progress, duration_seconds, lessonId, onProgress]);

  const handleProgress = (state) => {
    setProgress(state.played);
    setBuffered(state.loaded);
  };

  const handleDuration = (dur) => {
    setDuration(dur);
  };

  const handleSeek = (seconds) => {
    playerRef.current?.seekTo(seconds / duration_seconds);
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
  };

  const handleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`video-player-container ${fullscreen ? 'fullscreen' : ''}`}
      onMouseMove={() => setShowControls(true)}
    >
      <div className="video-player-wrapper">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          playbackRate={playbackRate}
          volume={volume}
          controls={false}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onDuration={handleDuration}
          progressInterval={1000}
          onEnded={() => setPlaying(false)}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
        />

        {/* Progress Bar */}
        <ProgressBar
          progress={progress}
          buffered={buffered}
          duration={duration_seconds}
          onSeek={handleSeek}
          formatTime={formatTime}
          visible={showControls}
        />

        {/* Controls */}
        {showControls && (
          <VideoControls
            playing={playing}
            volume={volume}
            playbackRate={playbackRate}
            currentTime={progress * duration_seconds}
            duration={duration_seconds}
            fullscreen={fullscreen}
            onPlayPause={handlePlayPause}
            onVolumeChange={handleVolumeChange}
            onPlaybackRateChange={handlePlaybackRateChange}
            onSeek={handleSeek}
            onFullscreen={handleFullscreen}
            formatTime={formatTime}
          />
        )}
      </div>

      {/* Video Info */}
      <div className="video-info">
        <div>
          <span className="watched-percentage">
            {Math.round(progress * 100)}% watched
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
```

### 3. Course Creator Wizard

```javascript
// client/src/components/courseBuilder/CourseCreatorWizard.js
import React, { useState } from 'react';
import axios from 'axios';
import StepIndicator from './StepIndicator';
import BasicInfoStep from './steps/BasicInfoStep';
import CurriculumStep from './steps/CurriculumStep';
import MediaUploadStep from './steps/MediaUploadStep';
import PricingStep from './steps/PricingStep';
import ReviewStep from './steps/ReviewStep';
import LoadingSpinner from '../common/LoadingSpinner';
import '../styles/CourseCreatorWizard.css';

const CourseCreatorWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState({
    // Basic Info
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    difficulty: 'Intermediate',
    language: 'English',
    objectives: [],
    prerequisites: [],
    targetAudience: [],
    tags: [],

    // Curriculum
    chapters: [],

    // Media
    thumbnail: null,
    previewVideo: null,

    // Pricing
    pricing: {
      isFree: false,
      price: 0,
      discountPercentage: 0,
      currency: 'INR'
    }
  });

  const steps = [
    { number: 1, title: 'Basic Information', component: BasicInfoStep },
    { number: 2, title: 'Curriculum', component: CurriculumStep },
    { number: 3, title: 'Media & Thumbnail', component: MediaUploadStep },
    { number: 4, title: 'Pricing', component: PricingStep },
    { number: 5, title: 'Review & Publish', component: ReviewStep }
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = (stepData) => {
    setCourseData(prev => ({
      ...prev,
      ...stepData
    }));

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/courses', courseData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success message
      alert('Course created successfully!');

      // Redirect to course detail page
      window.location.href = `/courses/${response.data.data._id}`;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-creator-wizard">
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Current Step Component */}
      <div className="wizard-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <CurrentStepComponent
            data={courseData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isFirstStep={currentStep === 1}
            isLastStep={currentStep === steps.length}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="error-alert">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="btn btn-secondary"
        >
          Previous
        </button>

        {currentStep < steps.length ? (
          <button
            onClick={() => handleNext(courseData)}
            className="btn btn-primary"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="btn btn-success"
          >
            {loading ? 'Publishing...' : 'Publish Course'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCreatorWizard;
```

### 4. Progress Dashboard

```javascript
// client/src/components/dashboard/ProgressTracker.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import '../styles/ProgressTracker.css';

const ProgressTracker = ({ courseId, enrollmentId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/progress/course/${courseId}`);
      setProgress(response.data.data);
    } catch (err) {
      setError('Failed to fetch progress');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;
  if (!progress) return <div>No progress data</div>;

  const { enrollment, progress: progressData } = progress;

  // Prepare chart data
  const chartData = progressData.map((p, index) => ({
    lesson: `Lesson ${index + 1}`,
    watchedDuration: p.totalTimeSpent / 60, // Convert to minutes
    quizScore: p.bestQuizScore || 0
  }));

  const completionData = [
    { name: 'Completed', value: enrollment.lessonsCompleted },
    { name: 'Remaining', value: enrollment.totalLessons - enrollment.lessonsCompleted }
  ];

  const COLORS = ['#4CAF50', '#FFC107'];

  return (
    <div className="progress-tracker">
      <h2>Your Progress</h2>

      {/* Progress Summary */}
      <div className="progress-summary">
        <div className="summary-card">
          <h3>Overall Progress</h3>
          <div className="progress-bar-large">
            <div 
              className="progress-fill"
              style={{ width: `${enrollment.progressPercentage}%` }}
            >
              {Math.round(enrollment.progressPercentage)}%
            </div>
          </div>
          <p>{enrollment.lessonsCompleted} of {enrollment.totalLessons} lessons completed</p>
        </div>

        <div className="summary-card">
          <h3>Watch Time</h3>
          <p className="stat-large">{(enrollment.performanceMetrics.totalWatchTime / 60).toFixed(1)} hours</p>
        </div>

        <div className="summary-card">
          <h3>Average Quiz Score</h3>
          <p className="stat-large">{enrollment.performanceMetrics.averageQuizScore.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-container">
        {/* Line Chart - Watch Time & Quiz Scores */}
        <div className="chart-wrapper">
          <h3>Learning Analytics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="lesson" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="watchedDuration" stroke="#8884d8" name="Watch Time (mins)" />
              <Line type="monotone" dataKey="quizScore" stroke="#82ca9d" name="Quiz Score (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Completion */}
        <div className="chart-wrapper">
          <h3>Lesson Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <div key={index}></div>
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lesson Details */}
      <div className="lesson-details">
        <h3>Lesson-by-Lesson Progress</h3>
        <div className="lessons-list">
          {progressData.map((p, index) => (
            <div key={index} className="lesson-item">
              <span className="lesson-number">Lesson {index + 1}</span>
              <div className="lesson-progress">
                <div className="progress-bar-small">
                  <div 
                    className="progress-fill"
                    style={{ width: `${p.status === 'completed' ? 100 : p.status === 'in_progress' ? 50 : 0}%` }}
                  />
                </div>
              </div>
              <span className={`status ${p.status}`}>{p.status}</span>
              <span className="time">{p.totalTimeSpent / 60}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
```

---

## STYLING REFERENCE

```css
/* client/src/styles/variables.css */
:root {
  /* Colors */
  --primary-color: #1a73e8;
  --secondary-color: #34a853;
  --danger-color: #ea4335;
  --warning-color: #fbbc04;
  --light-gray: #f8f9fa;
  --dark-gray: #202124;
  --text-color: #202124;
  --border-color: #dadce0;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Typography */
  --font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
  --shadow-md: 0 2px 4px 0 rgba(60, 64, 67, 0.3);
  --shadow-lg: 0 8px 16px 0 rgba(60, 64, 67, 0.15);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;

  /* Border Radius */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  :root {
    --spacing-lg: 16px;
    --spacing-xl: 24px;
  }
}

@media (max-width: 768px) {
  :root {
    --font-size-xl: 20px;
    --font-size-2xl: 24px;
    --spacing-lg: 12px;
  }
}

@media (max-width: 480px) {
  :root {
    --font-size-base: 14px;
    --spacing-md: 12px;
    --spacing-lg: 8px;
  }
}
```

---

This comprehensive frontend guide provides production-ready component implementations and styling for the Chess Learning Ecosystem's user interface.
