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
  getMe: () => api.get('/auth/me')
};

// ======================
// USERS
// ======================
export const userAPI = {
  getCoaches: (params) => api.get('/users/coaches', { params }),
  getCoachById: (id) => api.get(`/users/coach/${id}`),
  getUserProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (data) => api.put('/users/profile', data)
};

// ======================
// SLOTS
// ======================
export const slotAPI = {
  getMySlots: (params) => api.get('/slots/my-slots', { params }),
  createSlot: (data) => api.post('/slots', data),
  updateSlot: (id, data) => api.put(`/slots/${id}`, data),
  deleteSlot: (id) => api.delete(`/slots/${id}`),
  getSlots: (params) => api.get('/slots', { params })
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
  createBooking: (data) => api.post('/bookings', data)
};

// ======================
// PAYMENTS
// ======================
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getPaymentDetails: (id) => api.get(`/payments/${id}`)
};

// ======================
// WALLET
// ======================
export const walletAPI = {
  getMyWallet: () => api.get('/wallet/me'),
  addMoney: (data) => api.post('/wallet/add-money', data),
  getCoachEarnings: () => api.get('/wallet/earnings'),
  withdraw: (data) => api.post('/wallet/withdraw', data)
};

// ======================
// REVIEWS
// ======================
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getCoachReviews: (id) => api.get(`/reviews/coach/${id}`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`)
};

export default api;