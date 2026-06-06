const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Chapter = require('../models/Chapter');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { generateCertificateNumber, generateVerificationCode } = require('../utils/courseValidation');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ============================================
// ENROLLMENT CONTROLLERS
// ============================================

// @route   POST /api/enrollments
// @desc    Enroll student in a course
// @access  Private (Students only)
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId, paymentMethod } = req.body;
    const studentId = req.user.id;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // For free courses, create enrollment immediately
    if (course.pricing.isFree) {
      const enrollment = new Enrollment({
        student: studentId,
        course: courseId,
        enrollmentMethod: 'free',
        pricePaid: 0,
        actualPrice: 0,
        totalLessons: course.totalLessons,
        enrollmentStatus: 'active'
      });

      await enrollment.save();

      // Update course enrollment count
      course.enrollmentCount += 1;
      await course.save();

      // Initialize progress for all lessons
      const chapters = await Chapter.find({ course: courseId });
      for (const chapter of chapters) {
        const lessons = await Lesson.find({ chapter: chapter._id });
        for (const lesson of lessons) {
          await Progress.create({
            student: studentId,
            enrollment: enrollment._id,
            course: courseId,
            lesson: lesson._id,
            chapter: chapter._id,
            status: 'not_started'
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Successfully enrolled in free course',
        data: enrollment
      });
    }

    // For paid courses, create Razorpay order
    const discountAmount = (course.pricing.price * course.pricing.discountPercentage) / 100;
    const finalAmount = course.pricing.price - discountAmount;

    try {
      const order = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // Amount in paise
        currency: course.pricing.currency,
        receipt: `course-${courseId}-${Date.now()}`,
        notes: {
          courseId: courseId,
          studentId: studentId,
          courseName: course.title
        }
      });

      // Create enrollment record with pending status
      const enrollment = new Enrollment({
        student: studentId,
        course: courseId,
        enrollmentMethod: 'purchase',
        pricePaid: finalAmount,
        discount: discountAmount,
        discountPercentage: course.pricing.discountPercentage,
        actualPrice: course.pricing.price,
        currency: course.pricing.currency,
        totalLessons: course.totalLessons,
        enrollmentStatus: 'pending'
      });

      await enrollment.save();

      res.status(200).json({
        success: true,
        message: 'Payment order created',
        data: {
          orderId: order.id,
          enrollmentId: enrollment._id,
          amount: finalAmount,
          currency: order.currency,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    } catch (razorpayError) {
      console.error('Razorpay error:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Error creating payment order',
        error: razorpayError.message
      });
    }
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

// @route   POST /api/enrollments/verify-payment
// @desc    Verify Razorpay payment and complete enrollment
// @access  Private
exports.verifyEnrollmentPayment = async (req, res) => {
  try {
    const { enrollmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(razorpayOrderId + '|' + razorpayPaymentId);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update enrollment
    enrollment.paymentId = razorpayPaymentId;
    enrollment.enrollmentStatus = 'active';
    await enrollment.save();

    // Get course
    const course = await Course.findById(enrollment.course);
    if (course) {
      course.enrollmentCount += 1;
      course.totalEarnings += enrollment.pricePaid;
      await course.save();
    }

    // Initialize progress for all lessons
    const chapters = await Chapter.find({ course: enrollment.course });
    for (const chapter of chapters) {
      const lessons = await Lesson.find({ chapter: chapter._id });
      for (const lesson of lessons) {
        await Progress.create({
          student: enrollment.student,
          enrollment: enrollment._id,
          course: enrollment.course,
          lesson: lesson._id,
          chapter: chapter._id,
          status: 'not_started'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and enrollment completed',
      data: enrollment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// @route   GET /api/enrollments
// @desc    Get student's enrollments
// @access  Private
exports.getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      student: studentId,
      enrollmentStatus: status
    };

    const total = await Enrollment.countDocuments(query);

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title thumbnail category averageRating enrollmentCount')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// @route   GET /api/enrollments/:enrollmentId
// @desc    Get enrollment details
// @access  Private
exports.getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course')
      .populate('student', 'name email profileImage');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.student._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment details',
      error: error.message
    });
  }
};

// ============================================
// PROGRESS CONTROLLERS
// ============================================

// @route   POST /api/progress/:lessonId/complete
// @desc    Mark lesson as completed
// @access  Private
exports.markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { watchedDuration, quizScore } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Get enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: lesson.course
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course'
      });
    }

    // Find or create progress record
    let progress = await Progress.findOne({
      student: req.user.id,
      lesson: lessonId,
      enrollment: enrollment._id
    });

    if (!progress) {
      progress = new Progress({
        student: req.user.id,
        enrollment: enrollment._id,
        course: lesson.course,
        lesson: lessonId,
        chapter: lesson.chapter,
        status: 'completed'
      });
    } else {
      progress.status = 'completed';
    }

    // Update progress metrics
    if (watchedDuration !== undefined) {
      progress.watchedDuration = watchedDuration;
      progress.totalTimeSpent = (progress.totalTimeSpent || 0) + watchedDuration;
    }

    if (quizScore !== undefined) {
      progress.bestQuizScore = quizScore;
      progress.quizAttempts.push({
        attemptNumber: (progress.quizAttempts.length || 0) + 1,
        score: quizScore,
        attemptedAt: new Date()
      });
    }

    progress.completedAt = new Date();
    await progress.save();

    // Update enrollment progress
    const allProgress = await Progress.find({ enrollment: enrollment._id });
    const completedCount = allProgress.filter(p => p.status === 'completed').length;
    enrollment.lessonsCompleted = completedCount;
    enrollment.progressPercentage = (completedCount / enrollment.totalLessons) * 100;
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    // Update lesson engagement
    lesson.engagementMetrics.completions += 1;
    if (quizScore !== undefined) {
      const avgScore = (
        (lesson.engagementMetrics.averageQuizScore * (lesson.engagementMetrics.quizzesAttempted || 0) + quizScore) /
        ((lesson.engagementMetrics.quizzesAttempted || 0) + 1)
      );
      lesson.engagementMetrics.averageQuizScore = Math.round(avgScore);
      lesson.engagementMetrics.quizzesAttempted = (lesson.engagementMetrics.quizzesAttempted || 0) + 1;
    }
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed',
      data: {
        progress,
        enrollmentProgress: enrollment.progressPercentage
      }
    });
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking lesson complete',
      error: error.message
    });
  }
};

// @route   GET /api/progress/course/:courseId
// @desc    Get course progress
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    const progress = await Progress.find({
      enrollment: enrollment._id
    })
      .populate('lesson', 'title estimatedDuration')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        enrollment: {
          progressPercentage: enrollment.progressPercentage,
          lessonsCompleted: enrollment.lessonsCompleted,
          totalLessons: enrollment.totalLessons
        },
        progress
      }
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course progress',
      error: error.message
    });
  }
};

// ============================================
// CERTIFICATE CONTROLLERS
// ============================================

// @route   POST /api/certificates/:enrollmentId/generate
// @desc    Generate certificate
// @access  Private
exports.generateCertificate = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student')
      .populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate certificate'
      });
    }

    // Check if course is completed
    if (enrollment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: 'Course must be 100% completed to earn certificate'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      enrollment: enrollmentId
    });

    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated',
        data: existingCertificate
      });
    }

    const certificate = new Certificate({
      student: enrollment.student._id,
      course: enrollment.course._id,
      instructor: enrollment.course.instructor,
      enrollment: enrollmentId,
      certificateNumber: generateCertificateNumber(),
      verificationCode: generateVerificationCode(),
      completionPercentage: enrollment.progressPercentage,
      totalLessonsCompleted: enrollment.lessonsCompleted,
      totalLessons: enrollment.totalLessons,
      finalScore: enrollment.performanceMetrics.averageQuizScore,
      totalTimeSpent: Math.round(enrollment.performanceMetrics.totalWatchTime / 60) // Convert to hours
    });

    await certificate.save();

    // Update enrollment
    enrollment.certificateEarned = true;
    enrollment.certificateId = certificate._id;
    enrollment.certificateIssuedAt = new Date();
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
};

// @route   GET /api/certificates/:certificateNumber/verify
// @desc    Verify certificate
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({
      certificateNumber
    })
      .populate('student', 'name')
      .populate('course', 'title category')
      .populate('instructor', 'name title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    certificate.verificationCount += 1;
    if (certificate.status === 'issued') {
      certificate.status = 'verified';
    }
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate verified',
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.student.name,
        courseName: certificate.course.title,
        instructorName: certificate.instructor.name,
        instructorTitle: certificate.instructor.title,
        issuedAt: certificate.issuedAt,
        completionPercentage: certificate.completionPercentage,
        finalScore: certificate.finalScore,
        totalTimeSpent: certificate.totalTimeSpent
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message
    });
  }
};

// @route   GET /api/certificates
// @desc    Get user certificates
// @access  Private
exports.getUserCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      student: req.user.id
    })
      .populate('course', 'title category')
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      data: certificates
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message
    });
  }
};

module.exports = exports;
