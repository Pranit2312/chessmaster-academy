const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

// ============================================
// CHAPTER CONTROLLERS
// ============================================

// @route   POST /api/courses/:courseId/chapters
// @desc    Create a chapter in a course
// @access  Private (Course owner only)
exports.createChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, orderIndex } = req.body;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add chapters to this course'
      });
    }

    const chapter = new Chapter({
      course: courseId,
      title,
      description,
      orderIndex
    });

    await chapter.save();

    // Add chapter to course
    course.chapters.push(chapter._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message
    });
  }
};

// @route   GET /api/courses/:courseId/chapters
// @desc    Get all chapters in a course
// @access  Public
exports.getChapters = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const chapters = await Chapter.find({ course: courseId })
      .sort({ orderIndex: 1 })
      .populate('lessons');

    res.status(200).json({
      success: true,
      data: chapters
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message
    });
  }
};

// @route   PUT /api/courses/:courseId/chapters/:chapterId
// @desc    Update a chapter
// @access  Private (Course owner only)
exports.updateChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const { title, description, orderIndex } = req.body;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this chapter'
      });
    }

    let chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Update fields
    if (title) chapter.title = title;
    if (description) chapter.description = description;
    if (orderIndex !== undefined) chapter.orderIndex = orderIndex;

    chapter.updatedAt = Date.now();
    await chapter.save();

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message
    });
  }
};

// @route   DELETE /api/courses/:courseId/chapters/:chapterId
// @desc    Delete a chapter
// @access  Private (Course owner only)
exports.deleteChapter = async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chapter'
      });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Delete associated lessons
    await Lesson.deleteMany({ chapter: chapterId });

    // Remove chapter from course
    course.chapters = course.chapters.filter(c => c.toString() !== chapterId);
    await course.save();

    // Delete chapter
    await Chapter.findByIdAndDelete(chapterId);

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message
    });
  }
};

// ============================================
// LESSON CONTROLLERS
// ============================================

// @route   POST /api/chapters/:chapterId/lessons
// @desc    Create a lesson in a chapter
// @access  Private (Course owner only)
exports.createLesson = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, description, contentType, orderIndex, estimatedDuration, learningObjectives, isPreview } = req.body;

    // Get chapter
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Get course
    const course = await Course.findById(chapter.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add lessons to this chapter'
      });
    }

    const lesson = new Lesson({
      chapter: chapterId,
      course: chapter.course,
      title,
      description,
      contentType,
      orderIndex,
      estimatedDuration,
      learningObjectives,
      isPreview
    });

    await lesson.save();

    // Add lesson to chapter
    chapter.lessons.push(lesson._id);
    chapter.totalLessons += 1;
    chapter.totalDuration = (chapter.totalDuration || 0) + (estimatedDuration || 0);
    await chapter.save();

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lesson',
      error: error.message
    });
  }
};

// @route   GET /api/chapters/:chapterId/lessons
// @desc    Get all lessons in a chapter
// @access  Public
exports.getLessons = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const lessons = await Lesson.find({ chapter: chapterId })
      .sort({ orderIndex: 1 })
      .select('-video.videoQuality'); // Don't load all video quality options initially

    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lessons',
      error: error.message
    });
  }
};

// @route   GET /api/lessons/:lessonId
// @desc    Get lesson details
// @access  Public (for preview), Private (for full access if enrolled)
exports.getLessonDetails = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user has access
    if (!lesson.isPreview && req.user) {
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: lesson.course
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must purchase this course to view this lesson'
        });
      }
    }

    // For non-preview lessons without enrollment
    if (!lesson.isPreview && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to view this lesson'
      });
    }

    // Increment view count
    lesson.engagementMetrics.views += 1;
    await lesson.save();

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Error fetching lesson details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lesson details',
      error: error.message
    });
  }
};

// @route   PUT /api/lessons/:lessonId
// @desc    Update a lesson
// @access  Private (Course owner only)
exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, description, contentType, estimatedDuration, learningObjectives } = req.body;

    let lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Get course
    const course = await Course.findById(lesson.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson'
      });
    }

    // Update fields
    if (title) lesson.title = title;
    if (description) lesson.description = description;
    if (contentType) lesson.contentType = contentType;
    if (estimatedDuration !== undefined) lesson.estimatedDuration = estimatedDuration;
    if (learningObjectives) lesson.learningObjectives = learningObjectives;

    lesson.updatedAt = Date.now();
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lesson',
      error: error.message
    });
  }
};

// @route   DELETE /api/lessons/:lessonId
// @desc    Delete a lesson
// @access  Private (Course owner only)
exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Get course
    const course = await Course.findById(lesson.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson'
      });
    }

    // Get chapter
    const chapter = await Chapter.findById(lesson.chapter);
    if (chapter) {
      // Remove lesson from chapter
      chapter.lessons = chapter.lessons.filter(l => l.toString() !== lessonId);
      chapter.totalLessons -= 1;
      chapter.totalDuration = (chapter.totalDuration || 0) - (lesson.estimatedDuration || 0);
      await chapter.save();
    }

    // Delete progress records
    await Progress.deleteMany({ lesson: lessonId });

    // Delete lesson
    await Lesson.findByIdAndDelete(lessonId);

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message
    });
  }
};

module.exports = exports;
