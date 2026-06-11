import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// ======================
// TOKEN INTERCEPTOR
// ======================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======================
// RESPONSE INTERCEPTOR
// ======================
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ======================
// AUTH
// ======================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data)
};

// ======================
// USERS
// ======================
export const userAPI = {
  getCoaches: (params) => api.get('/users/coaches', { params }),
  getCoachById: (id) => api.get(`/users/coach/${id}`),
  getUserProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data)
};

// ======================
// SLOTS
// ======================
export const slotAPI = {
  getMySlots: (params) => api.get('/slots/my-slots', { params }),
  createSlot: (data) => api.post('/slots', data),
  updateSlot: (id, data) => api.put(`/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/slots/${id}`),
  getSlots: (params) => api.get('/slots', { params }),
  
  // Daily Class Creation
  getPredefinedSlots: () => api.get('/slots/predefined/list'),
  getDailySlotsForDate: (date) => api.get(`/slots/daily/${date}`),
  createDailySlots: (data) => api.post('/slots/daily/create', data),
  createBulkDailySlots: (data) => api.post('/slots/daily/bulk', data),
  deleteDailySlots: (date) => api.delete(`/slots/daily/${date}`)
};

// ======================
// BOOKINGS
// ======================
export const bookingAPI = {
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getCoachBookings: () => api.get('/bookings/coach-bookings'),
  getBooking: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  addNotes: (id, data) => api.put(`/bookings/${id}/notes`, data),
  createBooking: (data) => api.post('/bookings', data),
  getCoachSlots: (coachId) => api.get(`/slots/${coachId}`),
  bookSlot: (slotId) => api.post('/bookings', { slotId })
};

// ======================
// PAYMENTS
// ======================
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  verifySignature: (data) => api.post('/payments/verify-signature', data),
  getPaymentDetails: (id) => api.get(`/payments/${id}`)
};

// ======================
// WALLET
// ======================
export const walletAPI = {
  getMyWallet: () => api.get('/wallet/me'),
  getWallet: () => api.get('/wallet'),
  addMoney: (data) => api.post('/wallet/add-money', data),
  addFunds: (data) => api.post('/wallet/add-funds', data), // legacy
  createTopupOrder: (data) => api.post('/wallet/create-topup-order', data),
  verifyTopupPayment: (data) => api.post('/wallet/verify-topup', data),
  getCoachEarnings: () => api.get('/wallet/earnings'),
  getTransactions: () => api.get('/wallet/transactions'),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  requestWithdrawal: (data) => api.post('/wallet/request-withdrawal', data),
  resetWallet: () => api.post('/wallet/reset')
};

// ======================
// REVIEWS
// ======================
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getCoachReviews: (id) => api.get(`/reviews/coach/${id}`),
  getReviews: (courseId) => api.get(`/reviews/course/${courseId}`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`)
};

// ======================
// COURSES
// ======================
export const courseAPI = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  getCoachCourses: () => api.get('/courses/coach/my-courses'),
  publishCourse: (id) => api.post(`/courses/${id}/publish`)
};

// ======================
// CHAPTERS
// ======================
export const chapterAPI = {
  createChapter: (courseId, data) => api.post(`/courses/${courseId}/chapters`, data),
  updateChapter: (id, data) => api.put(`/chapters/${id}`, data),
  deleteChapter: (id) => api.delete(`/chapters/${id}`)
};

// ======================
// LESSONS
// ======================
export const lessonAPI = {
  createLesson: (chapterId, data) => api.post(`/chapters/${chapterId}/lessons`, data),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  getLesson: (id) => api.get(`/lessons/${id}`)
};

// ======================
// ENROLLMENTS
// ======================
export const enrollmentAPI = {
  enrollInCourse: (data) => api.post('/enrollments', data),
  getMyEnrollments: () => api.get('/enrollments/my-courses'),
  getEnrollmentById: (id) => api.get(`/enrollments/${id}`),
  verifyPayment: (data) => api.post('/enrollments/verify-payment', data)
};

// ======================
// PROGRESS
// ======================
export const progressAPI = {
  getProgress: (courseId) => api.get(`/progress/${courseId}`),
  updateProgress: (lessonId, data) => api.post(`/progress/${lessonId}`, data),
  markLessonComplete: (lessonId) => api.post(`/progress/${lessonId}/complete`)
};

// ======================
// CERTIFICATES
// ======================
export const certificateAPI = {
  generateCertificate: (enrollmentId) => api.post(`/certificates/${enrollmentId}/generate`),
  verifyCertificate: (certificateNumber) => api.get(`/certificates/${certificateNumber}/verify`),
  downloadCertificate: (enrollmentId) => api.get(`/certificates/${enrollmentId}/download`, { responseType: 'blob' })
};

// ======================
// AI GAME ANALYSIS (Phase 2)
// ======================
export const analysisAPI = {
  submitAnalysis: (data) => api.post('/analysis/submit', data),
  getMyAnalyses: (params) => api.get('/analysis/my-analyses', { params }),
  getAnalysisById: (id) => api.get(`/analysis/${id}`),
  getAnalysisStatus: (id) => api.get(`/analysis/${id}/status`),
  deleteAnalysis: (id) => api.delete(`/analysis/${id}`)
};

// ======================
// AI FEATURES (Phase 2)
// ======================
export const aiAPI = {
  // Engine
  getEngineStatus: () => api.get('/ai/engine/status'),
  testEngine: () => api.post('/ai/engine/test'),

  // Bot Practice
  startBotGame: (data) => api.post('/ai/bot/start', data),
  makeBotMove: (gameId, data) => api.post(`/ai/bot/${gameId}/move`, data),
  getBotGame: (gameId) => api.get(`/ai/bot/${gameId}`),
  getBotGames: (params) => api.get('/ai/bot/games', { params }),
  resignBotGame: (gameId) => api.put(`/ai/bot/${gameId}/resign`),
  analyzeBotGame: (gameId) => api.post(`/ai/bot/${gameId}/analyze`),

  // Puzzles
  getDailyPuzzle: () => api.get('/ai/puzzles/daily'),
  getPuzzles: (params) => api.get('/ai/puzzles', { params }),
  getPuzzleById: (id) => api.get(`/ai/puzzles/${id}`),
  solvePuzzle: (id, data) => api.post(`/ai/puzzles/${id}/solve`, data),
  getPuzzleStats: () => api.get('/ai/puzzles/stats'),
  syncPuzzles: (params) => api.post('/ai/puzzles/sync', null, { params }),
  resetPuzzles: () => api.post('/ai/puzzles/reset'),

  // Openings
  getOpeningRecommendations: (params) => api.get('/ai/openings/recommendations', { params }),
  exploreOpening: (ecoCode) => api.get(`/ai/openings/explore${ecoCode ? `/${ecoCode}` : ''}`),
  getOpeningMoves: (ecoCode) => api.get(`/ai/openings/${ecoCode}/moves`),
  searchOpenings: (params) => api.get('/ai/openings/search', { params }),
  getUserOpeningStats: () => api.get('/ai/openings/user-stats'),

  // Chat
  sendChatMessage: (data) => api.post('/ai/chat/send', data),
  getChatHistory: () => api.get('/ai/chat/history'),
  getChatById: (id) => api.get(`/ai/chat/${id}`),
  clearChat: (id) => api.delete(`/ai/chat/${id}`),

  // Insights
  getWeaknessAnalysis: () => api.get('/ai/insights/weaknesses'),
  getRecommendations: () => api.get('/ai/insights/recommendations'),
  getProgressInsights: () => api.get('/ai/insights/progress'),
  getSkillAssessment: () => api.get('/ai/insights/assessment'),
  getInsightsSummary: () => api.get('/ai/insights/summary'),
  dismissInsight: (id) => api.put(`/ai/insights/${id}/dismiss`)
};

// ======================
// PUZZLE PLATFORM (Phase 2)
// ======================
export const puzzleAPI = {
  getRandom: () => api.get('/puzzles/random'),
  getDaily: () => api.get('/puzzles/daily'),
  getByTheme: (theme, params) => api.get(`/puzzles/theme/${theme}`, { params }),
  getByRating: (range, params) => api.get(`/puzzles/rating/${range}`, { params }),
  getRecommended: (params) => api.get('/puzzles/recommended', { params }),
  check: (data) => api.post('/puzzles/check', data),
  getStats: () => api.get('/puzzles/stats'),
  getProfile: () => api.get('/puzzles/profile'),
  markDailySolved: () => api.post('/puzzles/daily/solved'),
  getHint: (puzzleId) => api.get(`/puzzles/${puzzleId}/hint`),

  // Rush
  startRush: (data) => api.post('/puzzles/rush/start', data),
  rushNext: (data) => api.post('/puzzles/rush/next', data),
  endRush: (sessionId) => api.post(`/puzzles/rush/${sessionId}/end`),
  rushLeaderboard: (params) => api.get('/puzzles/rush/leaderboard', { params }),
  rushHistory: () => api.get('/puzzles/rush/history'),

  // Coach
  createCoachPuzzle: (data) => api.post('/puzzles/coach/create', data),
  getMyCoachPuzzles: (params) => api.get('/puzzles/coach/mine', { params }),
  browseCoachPuzzles: (params) => api.get('/puzzles/coach/browse', { params }),
  getCoachPuzzle: (id) => api.get(`/puzzles/coach/${id}`),
  updateCoachPuzzle: (id, data) => api.put(`/puzzles/coach/${id}`, data),
  deleteCoachPuzzle: (id) => api.delete(`/puzzles/coach/${id}`),
  likeCoachPuzzle: (id) => api.post(`/puzzles/coach/${id}/like`),
  saveCoachPuzzle: (id) => api.post(`/puzzles/coach/${id}/save`)
};

// ======================
// ADMIN
// ======================
export const adminAPI = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getRevenue: () => api.get('/admin/analytics/revenue'),
  getGrowth: () => api.get('/admin/analytics/growth'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  suspendUser: (id, days) => api.put(`/admin/users/${id}/suspend`, { days }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  restoreUser: (id) => api.put(`/admin/users/${id}/restore`),
  getCoaches: (params) => api.get('/admin/coaches', { params }),
  verifyCoach: (id) => api.put(`/admin/coaches/${id}/verify`),
  rejectCoach: (id) => api.put(`/admin/coaches/${id}/reject`),
  featureCoach: (id) => api.put(`/admin/coaches/${id}/feature`),
  unfeatureCoach: (id) => api.put(`/admin/coaches/${id}/unfeature`),
  getCourses: (params) => api.get('/admin/courses', { params }),
  approveCourse: (id) => api.put(`/admin/courses/${id}/approve`),
  rejectCourse: (id, reason) => api.put(`/admin/courses/${id}/reject`, { reason }),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getTransactions: (params) => api.get('/admin/payments/transactions', { params }),
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  approveWithdrawal: (id) => api.put(`/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id) => api.put(`/admin/withdrawals/${id}/reject`)
};

// ======================
// TOURNAMENTS
// ======================
export const tournamentAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getActive: () => api.get('/tournaments/active'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  remove: (id) => api.delete(`/tournaments/${id}`),
  register: (id) => api.post(`/tournaments/${id}/register`),
  unregister: (id) => api.post(`/tournaments/${id}/unregister`),
  start: (id) => api.post(`/tournaments/${id}/start`),
  nextRound: (id) => api.post(`/tournaments/${id}/next-round`),
  end: (id) => api.post(`/tournaments/${id}/end`),
  getStandings: (id) => api.get(`/tournaments/${id}/standings`),
  getPairings: (id) => api.get(`/tournaments/${id}/pairings`),
  getMy: () => api.get('/tournaments/my'),
  getStats: () => api.get('/tournaments/stats')
};

// ======================
// FORUM
// ======================
export const forumAPI = {
  getDiscussions: (params) => api.get('/forum/discussions', { params }),
  getDiscussion: (id) => api.get(`/forum/discussions/${id}`),
  createDiscussion: (data) => api.post('/forum/discussions', data),
  updateDiscussion: (id, data) => api.put(`/forum/discussions/${id}`, data),
  deleteDiscussion: (id) => api.delete(`/forum/discussions/${id}`),
  likeDiscussion: (id) => api.post(`/forum/discussions/${id}/like`),
  getReplies: (id, params) => api.get(`/forum/discussions/${id}/replies`, { params }),
  createReply: (id, data) => api.post(`/forum/discussions/${id}/replies`, data),
  updateReply: (id, data) => api.put(`/forum/replies/${id}`, data),
  deleteReply: (id) => api.delete(`/forum/replies/${id}`),
  markSolution: (id) => api.post(`/forum/replies/${id}/solution`),
  likeReply: (id) => api.post(`/forum/replies/${id}/like`)
};

// ======================
// NOTIFICATIONS
// ======================
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count')
};

// ======================
// ACHIEVEMENTS
// ======================
export const achievementAPI = {
  getMine: () => api.get('/achievements/mine'),
  getAll: () => api.get('/achievements')
};

// ======================
// GAMES
// ======================
export const gameAPI = {
  getById: (id) => api.get(`/games/${id}`),
  getMy: (params) => api.get('/games/my', { params }),
  getActive: () => api.get('/games/active'),
  getLive: () => api.get('/games/live'),
  getRating: () => api.get('/games/rating'),
  getLeaderboard: (params) => api.get('/games/leaderboard', { params }),
  getReplay: (id) => api.get(`/games/${id}/replay`),
  analyze: (id) => api.post(`/games/${id}/analyze`),
  getOpponent: (username) => api.get(`/games/opponent/${username}`),
  getFriends: () => api.get('/games/friends'),
  getFriendRequests: () => api.get('/games/friends/pending'),
  sendFriendRequest: (id) => api.post('/games/friends/request', { recipientId: id }),
  acceptFriendRequest: (id) => api.put(`/games/friends/accept/${id}`),
  rejectFriendRequest: (id) => api.put(`/games/friends/reject/${id}`),
  removeFriend: (id) => api.delete(`/games/friends/${id}`),
  searchUsers: (q) => api.get('/games/friends/search', { params: { q } })
};

export default api;