const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const sessionManagement = require('../utils/sessionManagement');

/**
 * ========================================
 * SESSION MANAGEMENT ROUTES
 * ========================================
 */

/**
 * POST /api/sessions/book
 * Student books a slot and creates a session
 */
router.post('/book', protect, restrictTo('student'), async (req, res) => {
  try {
    const { slotId, notes, skillLevel } = req.body;

    if (!slotId) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID is required'
      });
    }

    const result = await sessionManagement.createSession(
      req.user.id,
      slotId,
      { notes, skillLevel }
    );

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/my-sessions
 * Get all sessions for logged-in user (student or coach)
 */
router.get('/my-sessions', protect, async (req, res) => {
  try {
    const { status, date } = req.query;

    let result;
    if (req.user.role === 'coach') {
      result = await sessionManagement.getCoachSessions(req.user.id, {
        status,
        date
      });
    } else {
      result = await sessionManagement.getStudentSessions(req.user.id, {
        status
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/upcoming
 * Get upcoming sessions for the user
 */
router.get('/upcoming', protect, async (req, res) => {
  try {
    const userType = req.user.role === 'coach' ? 'coach' : 'student';
    const result = await sessionManagement.getUpcomingSessions(
      req.user.id,
      userType
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get detailed information about a specific session
 */
router.get('/:sessionId', protect, async (req, res) => {
  try {
    const result = await sessionManagement.getSessionDetails(req.params.sessionId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/status
 * Update session status (coach only)
 */
router.put('/:sessionId/status', protect, restrictTo('coach'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await sessionManagement.updateSessionStatus(
      req.params.sessionId,
      status,
      req.user.id
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/complete
 * Mark session as completed and add coach notes
 */
router.put('/:sessionId/complete', protect, restrictTo('coach'), async (req, res) => {
  try {
    const { notes } = req.body;

    const result = await sessionManagement.completeSession(
      req.params.sessionId,
      notes
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/cancel
 * Cancel a session
 */
router.put('/:sessionId/cancel', protect, async (req, res) => {
  try {
    const result = await sessionManagement.updateSessionStatus(
      req.params.sessionId,
      'cancelled',
      req.user.role === 'coach' ? req.user.id : null
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/coach/:coachId/all
 * Get all sessions for a specific coach (public view)
 */
router.get('/coach/:coachId/all', async (req, res) => {
  try {
    const result = await sessionManagement.getCoachSessions(req.params.coachId, {
      status: 'completed'
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/coach/:coachId/stats
 * Get session statistics for a coach
 */
router.get('/coach/:coachId/stats', async (req, res) => {
  try {
    const result = await sessionManagement.getSessionStats(req.params.coachId);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/sessions/:sessionId/generate-zoom
 * Generate Zoom meeting link for confirmed session (Coach only)
 */
router.post('/:sessionId/generate-zoom', protect, restrictTo('coach'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await sessionManagement.generateSessionZoomLink(
      sessionId,
      req.user.id
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: '🎥 Zoom meeting link generated',
        meeting: result
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/sessions/:sessionId/zoom-details
 * Get Zoom meeting details for session
 */
router.get('/:sessionId/zoom-details', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const session = await Booking.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify user is student or coach in this session
    if (session.studentId.toString() !== req.user.id && session.coachId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      meeting: {
        link: session.meetingLink,
        platform: session.meetingPlatform,
        password: session.meetingPassword,
        meetingId: session.meetingLink?.split('/').pop()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
