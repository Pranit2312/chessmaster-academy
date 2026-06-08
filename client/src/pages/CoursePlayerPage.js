import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseAPI, progressAPI } from '../utils/api';
import '../styles/CoursePlayerPage.css';

const CoursePlayerPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(0);

  const fetchCourseContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourseById(courseId);
      setCourse(response.data);
      
      // Set first lesson as current
      if (response.data.chapters?.length > 0) {
        const firstLesson = response.data.chapters[0].lessons?.[0];
        if (firstLesson) {
          setCurrentLesson(firstLesson);
        }
      }

      // Fetch progress
      const progressResponse = await progressAPI.getProgress(courseId);
      setProgress(progressResponse.data);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseContent();
  }, [fetchCourseContent]);

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
  };

  const markLessonComplete = async () => {
    if (!currentLesson) return;
    try {
      await progressAPI.markLessonComplete(currentLesson._id);
      // Update local progress state
      const updatedLessons = [...(progress?.completedLessons || [])];
      if (!updatedLessons.includes(currentLesson._id)) {
        updatedLessons.push(currentLesson._id);
        const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
        const newPercentage = Math.round((updatedLessons.length / totalLessons) * 100);
        
        setProgress({
          ...progress,
          completedLessons: updatedLessons,
          progressPercentage: newPercentage
        });
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="course-player-page">
      <div className="player-container">
        {/* MAIN VIDEO / CONTENT AREA */}
        <main className="video-section">
          <div className="video-player">
            {currentLesson?.contentType === 'video' ? (
              <video 
                key={currentLesson.videoUrl}
                controls 
                className="video"
                onEnded={markLessonComplete}
              >
                <source src={currentLesson.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : currentLesson?.contentType === 'article' ? (
              <div className="article-viewer card">
                <h2>{currentLesson.title}</h2>
                <div className="article-content" dangerouslySetInnerHTML={{ __html: currentLesson.content }}></div>
                {currentLesson.resources?.some(r => r.type === 'pdf') && (
                  <div className="pdf-resource-box">
                    <p>📄 This lesson includes a PDF guide.</p>
                    <a 
                      href={currentLesson.resources.find(r => r.type === 'pdf').url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      View PDF Notes
                    </a>
                  </div>
                )}
                <button className="btn btn-primary" style={{marginTop: '2rem'}} onClick={markLessonComplete}>
                  Mark as Read
                </button>
              </div>
            ) : currentLesson?.contentType === 'pgn' ? (
              <div className="pgn-viewer-container card">
                <div className="pgn-header">
                  <h2>♟️ Opening Repertoire: {currentLesson.title}</h2>
                  <div className="pgn-badge">PGN Repertoire</div>
                </div>
                
                <div className="pgn-main-view">
                  <div className="pgn-board-placeholder">
                    {/* 
                      Future enhancement: Integrate react-chessboard here.
                      For now, we provide a clean PGN text viewer and download option.
                    */}
                    <div className="placeholder-board">
                      <div className="board-grid">
                        {[...Array(64)].map((_, i) => (
                          <div key={i} className={`board-square ${(Math.floor(i / 8) + i) % 2 === 0 ? 'light' : 'dark'}`}></div>
                        ))}
                      </div>
                      <div className="board-overlay">
                        <span className="pawn-icon">♟️</span>
                        <p>Interactive board coming soon</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pgn-content-side">
                    <div className="pgn-box">
                      <pre>{currentLesson.pgnContent || 'PGN content not available.'}</pre>
                    </div>
                    <div className="pgn-actions">
                      <button className="btn btn-secondary" onClick={() => {
                        const blob = new Blob([currentLesson.pgnContent], { type: 'text/plain' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentLesson.title}.pgn`;
                        a.click();
                      }}>
                        Download PGN
                      </button>
                      <button className="btn btn-primary" onClick={markLessonComplete}>
                        Mark as Completed
                      </button>
                    </div>
                  </div>
                </div>
                <p className="pgn-hint">Tip: Use a chess engine like Stockfish or a viewer like Chess.com/Lichess to analyze this PGN.</p>
              </div>
            ) : (
              <div className="placeholder-content">
                <h3>Select a lesson to start learning</h3>
              </div>
            )}
          </div>

          <div className="lesson-info">
            <h2>{currentLesson?.title}</h2>
            <p>{currentLesson?.description}</p>
          </div>
        </main>

        {/* SIDEBAR CURRICULUM */}
        <aside className="curriculum-sidebar">
          <div className="progress-bar">
            <div className="progress-label">
              <span>Your Progress</span>
              <span>{progress?.progressPercentage || 0}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="curriculum-list">
            <h3>Course Content</h3>
            {course?.chapters.map((chapter, index) => (
              <div key={chapter._id} className="chapter-group">
                <div 
                  className="chapter-header"
                  onClick={() => setExpandedChapter(expandedChapter === index ? -1 : index)}
                >
                  <span>{expandedChapter === index ? '▼' : '▶'}</span>
                  <strong>{chapter.title}</strong>
                </div>
                
                {expandedChapter === index && (
                  <div className="lessons-list-mini">
                    {chapter.lessons.map(lesson => (
                      <div 
                        key={lesson._id} 
                        className={`lesson-item ${currentLesson?._id === lesson._id ? 'active' : ''} ${progress?.completedLessons?.includes(lesson._id) ? 'completed' : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <span className="lesson-icon">
                          {lesson.contentType === 'video' ? '▶️' : lesson.contentType === 'article' ? '📄' : '♟️'}
                        </span>
                        <span className="lesson-title">{lesson.title}</span>
                        {progress?.completedLessons?.includes(lesson._id) && (
                          <span className="check-icon">✅</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
