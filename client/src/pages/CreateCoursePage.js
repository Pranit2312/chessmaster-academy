import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseAPI, chapterAPI, lessonAPI } from '../utils/api';
import '../styles/CreateCoursePage.css';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'Openings',
    difficulty: 'Beginner',
    language: 'English',
    objectives: [],
    prerequisites: [],
    pricing: {
      isFree: false,
      price: 0,
      discountPercentage: 0
    },
    tags: []
  });

  const [chapters, setChapters] = useState([]);
  const [newObjective, setNewObjective] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');

  const handleCourseChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('pricing.')) {
      const field = name.split('.')[1];
      setCourse(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [field]: type === 'checkbox' ? checked : (field === 'price' || field === 'discountPercentage' ? Number(value) : value)
        }
      }));
    } else {
      setCourse(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setCourse(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (idx) => {
    setCourse(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== idx)
    }));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setCourse(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite]
      }));
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (idx) => {
    setCourse(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== idx)
    }));
  };

  const handleCreateCourse = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.createCourse(course);
      setCourse(prev => ({ ...prev, _id: response.data._id }));
      setStep(2);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = () => {
    setChapters(prev => [...prev, {
      title: '',
      description: '',
      lessons: []
    }]);
  };

  const handleChapterChange = (idx, field, value) => {
    const updated = [...chapters];
    updated[idx][field] = value;
    setChapters(updated);
  };

  const handleAddLesson = (chapterIdx) => {
    const updated = [...chapters];
    updated[chapterIdx].lessons.push({
      title: '',
      description: '',
      contentType: 'video',
      estimatedDuration: 10,
      isPreview: false
    });
    setChapters(updated);
  };

  const handleLessonChange = (chapterIdx, lessonIdx, field, value) => {
    const updated = [...chapters];
    updated[chapterIdx].lessons[lessonIdx][field] = value;
    setChapters(updated);
  };

  const handleRemoveLesson = (chapterIdx, lessonIdx) => {
    const updated = [...chapters];
    updated[chapterIdx].lessons = updated[chapterIdx].lessons.filter((_, i) => i !== lessonIdx);
    setChapters(updated);
  };

  const handlePublishCourse = async () => {
    try {
      setLoading(true);
      // Create chapters and lessons
      for (const chapter of chapters) {
        const chapterResponse = await chapterAPI.createChapter(course._id, {
          title: chapter.title,
          description: chapter.description
        });

        // Create lessons for each chapter
        for (const lesson of chapter.lessons) {
          await lessonAPI.createLesson(chapterResponse.data._id, lesson);
        }
      }

      // Publish course
      await courseAPI.publishCourse(course._id);
      navigate('/coach/dashboard');
    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Failed to publish course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="create-course-page">
      <div className="course-creation-wizard">
        <div className="wizard-header">
          <h1>Create a Course</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Course Info</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Curriculum</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Review</div>
          </div>
        </div>

        {step === 1 && (
          <div className="step-content">
            <h2>Course Information</h2>
            
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                name="title"
                value={course.title}
                onChange={handleCourseChange}
                placeholder="Enter course title"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Short Description *</label>
              <input
                type="text"
                name="shortDescription"
                value={course.shortDescription}
                onChange={handleCourseChange}
                placeholder="One-line summary"
                maxLength={160}
              />
            </div>

            <div className="form-group">
              <label>Full Description *</label>
              <textarea
                name="description"
                value={course.description}
                onChange={handleCourseChange}
                placeholder="Detailed course description"
                rows={6}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={course.category} onChange={handleCourseChange}>
                  <option>Openings</option>
                  <option>Tactics</option>
                  <option>Strategy</option>
                  <option>Endgames</option>
                  <option>Puzzles</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty Level *</label>
                <select name="difficulty" value={course.difficulty} onChange={handleCourseChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Learning Objectives</label>
              <div className="objective-input">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="What will students learn?"
                  onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                />
                <button type="button" onClick={addObjective}>Add</button>
              </div>
              <div className="objectives-list">
                {course.objectives.map((obj, idx) => (
                  <div key={idx} className="objective-tag">
                    {obj}
                    <button type="button" onClick={() => removeObjective(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Prerequisites</label>
              <div className="objective-input">
                <input
                  type="text"
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  placeholder="What should students know?"
                  onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                />
                <button type="button" onClick={addPrerequisite}>Add</button>
              </div>
              <div className="objectives-list">
                {course.prerequisites.map((prereq, idx) => (
                  <div key={idx} className="objective-tag">
                    {prereq}
                    <button type="button" onClick={() => removePrerequisite(idx)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pricing-section">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="pricing.isFree"
                    checked={course.pricing.isFree}
                    onChange={handleCourseChange}
                  />
                  Free Course
                </label>
              </div>

              {!course.pricing.isFree && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (₹) *</label>
                      <input
                        type="number"
                        name="pricing.price"
                        value={course.pricing.price}
                        onChange={handleCourseChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label>Discount (%)</label>
                      <input
                        type="number"
                        name="pricing.discountPercentage"
                        value={course.pricing.discountPercentage}
                        onChange={handleCourseChange}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleCreateCourse}
                disabled={!course.title || !course.description}
              >
                Next: Add Curriculum
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Course Curriculum</h2>
            
            <div className="chapters-list">
              {chapters.map((chapter, idx) => (
                <ChapterForm
                  key={idx}
                  chapter={chapter}
                  index={idx}
                  onChange={(field, value) => handleChapterChange(idx, field, value)}
                  onAddLesson={() => handleAddLesson(idx)}
                  onLessonChange={(lIdx, field, value) => handleLessonChange(idx, lIdx, field, value)}
                  onRemoveLesson={(lIdx) => handleRemoveLesson(idx, lIdx)}
                />
              ))}
            </div>

            <button className="btn-secondary" onClick={handleAddChapter}>
              + Add Chapter
            </button>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={() => setStep(3)}
                disabled={chapters.length === 0 || chapters.some(c => !c.title || c.lessons.length === 0)}
              >
                Review & Publish
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Review Your Course</h2>
            
            <div className="review-section">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              
              <div className="review-details">
                <div><strong>Category:</strong> {course.category}</div>
                <div><strong>Difficulty:</strong> {course.difficulty}</div>
                <div><strong>Price:</strong> {course.pricing.isFree ? 'Free' : `₹${course.pricing.price}`}</div>
                <div><strong>Chapters:</strong> {chapters.length}</div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={handlePublishCourse}
              >
                Publish Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChapterForm = ({ chapter, index, onChange, onAddLesson, onLessonChange, onRemoveLesson }) => {
  const [showLessons, setShowLessons] = useState(true);

  return (
    <div className="chapter-form">
      <div className="chapter-header">
        <h3>Chapter {index + 1}: {chapter.title || 'Untitled Chapter'}</h3>
        <button 
          className="toggle-btn"
          onClick={() => setShowLessons(!showLessons)}
        >
          {showLessons ? '▼' : '▶'}
        </button>
      </div>

      {showLessons && (
        <div className="chapter-body">
          <div className="form-group">
            <label>Chapter Title</label>
            <input
              type="text"
              placeholder="Enter chapter title"
              value={chapter.title}
              onChange={(e) => onChange('title', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="What is this chapter about?"
              value={chapter.description}
              onChange={(e) => onChange('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="lessons-section">
            <h4>Lessons</h4>
            <div className="lessons-list">
              {chapter.lessons.map((lesson, lIdx) => (
                <div key={lIdx} className="lesson-form-mini">
                  <div className="lesson-header-mini">
                    <span>Lesson {lIdx + 1}</span>
                    <button className="remove-btn" onClick={() => onRemoveLesson(lIdx)}>×</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Lesson title"
                    value={lesson.title}
                    onChange={(e) => onLessonChange(lIdx, 'title', e.target.value)}
                  />
                  <div className="lesson-meta-inputs">
                    <select 
                      value={lesson.contentType} 
                      onChange={(e) => onLessonChange(lIdx, 'contentType', e.target.value)}
                    >
                      <option value="video">Video</option>
                      <option value="article">Article/PDF</option>
                      <option value="pgn">PGN File</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Min"
                      value={lesson.estimatedDuration}
                      onChange={(e) => onLessonChange(lIdx, 'estimatedDuration', Number(e.target.value))}
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={lesson.isPreview}
                        onChange={(e) => onLessonChange(lIdx, 'isPreview', e.target.checked)}
                      />
                      Preview
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary btn-sm" onClick={onAddLesson}>
              + Add Lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCoursePage;
