import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import CoachDashboard from './pages/CoachDashboard';
import CoachProfile from './pages/CoachProfile';
import BrowseCoaches from './pages/BrowseCoaches';
import MyBookings from './pages/MyBookings';
import CoachBookings from './pages/CoachBookings';
import ProfilePage from './pages/ProfilePage';
import Wallet from "./pages/Wallet";
import CoachEarnings from "./pages/CoachEarnings";
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import MyCoursesPage from './pages/MyCoursesPage';
import CreateCoursePage from './pages/CreateCoursePage';
import GameAnalysisPage from './pages/GameAnalysisPage';
import AnalysisResultPage from './pages/AnalysisResultPage';

// Puzzle Platform Pages (Phase 2)
import PuzzlesPage from './pages/PuzzlesPage';
import PuzzleRushPage from './pages/PuzzleRushPage';
import CoachPuzzleCreator from './pages/CoachPuzzleCreator';

// AI Pages (Phase 2)
import AiPracticePage from './pages/AiPracticePage';
import AiPuzzlesPage from './pages/AiPuzzlesPage';
import AiOpeningExplorerPage from './pages/AiOpeningExplorerPage';
import AiCoachPage from './pages/AiCoachPage';
import AiInsightsPage from './pages/AiInsightsPage';

// Phase 3 Pages
import AdminDashboard from './pages/AdminDashboard';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import ForumPage from './pages/ForumPage';
import ForumDetailPage from './pages/ForumDetailPage';
import StudentAnalytics from './pages/StudentAnalytics';
import CoachAnalytics from './pages/CoachAnalytics';

// Phase 4 Pages
import PlayPage from './pages/PlayPage';
import GamePage from './pages/GamePage';
import GameReplayPage from './pages/GameReplayPage';
import MyGamesPage from './pages/MyGamesPage';
import FriendsPage from './pages/FriendsPage';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return (
      <Navigate
        to={user.role === 'coach' ? '/coach/dashboard' : '/student/dashboard'}
        replace
      />
    );
  }

  return children;
};

function AppContent() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <Navbar />
      <div className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Wallet */}
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        {/* Coach Earnings (Phase 1) */}
        <Route
          path="/coach/earnings"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachEarnings />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse-coaches"
          element={
            <ProtectedRoute requiredRole="student">
              <BrowseCoaches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse"
          element={
            <ProtectedRoute requiredRole="student">
              <BrowseCoaches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute requiredRole="student">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Course Routes (All Users) */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/course-player/:id"
          element={
            <ProtectedRoute>
              <CoursePlayerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-courses"
          element={
            <ProtectedRoute requiredRole="student">
              <MyCoursesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-course"
          element={
            <ProtectedRoute requiredRole="coach">
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />

        {/* Puzzle Platform Routes (Phase 2) */}
        <Route
          path="/puzzles"
          element={
            <ProtectedRoute>
              <PuzzlesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/puzzles/rush"
          element={
            <ProtectedRoute>
              <PuzzleRushPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/puzzles/create"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachPuzzleCreator />
            </ProtectedRoute>
          }
        />

        {/* AI Game Analysis (Phase 2) */}
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <GameAnalysisPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analysis/:id"
          element={
            <ProtectedRoute>
              <AnalysisResultPage />
            </ProtectedRoute>
          }
        />

        {/* Coach Routes */}
        <Route
          path="/coach/dashboard"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/bookings"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachBookings />
            </ProtectedRoute>
          }
        />

        {/* Common Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach/:id"
          element={
            <ProtectedRoute>
              <CoachProfile />
            </ProtectedRoute>
          }
        />

        {/* AI Feature Routes (Phase 2) */}
        <Route
          path="/ai/practice"
          element={
            <ProtectedRoute>
              <AiPracticePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/puzzles"
          element={
            <ProtectedRoute>
              <AiPuzzlesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/openings"
          element={
            <ProtectedRoute>
              <AiOpeningExplorerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/coach"
          element={
            <ProtectedRoute>
              <AiCoachPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/insights"
          element={
            <ProtectedRoute>
              <AiInsightsPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 3: Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Phase 3: Tournaments */}
        <Route
          path="/tournaments"
          element={
            <ProtectedRoute>
              <TournamentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournaments/:id"
          element={
            <ProtectedRoute>
              <TournamentDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 3: Analytics */}
        <Route
          path="/student/analytics"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/analytics"
          element={
            <ProtectedRoute requiredRole="coach">
              <CoachAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Phase 3: Forum */}
        <Route
          path="/forum"
          element={
            <ProtectedRoute>
              <ForumPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/:id"
          element={
            <ProtectedRoute>
              <ForumDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Phase 4: Live Play */}
        <Route
          path="/play"
          element={
            <ProtectedRoute>
              <PlayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/play/:gameId"
          element={
            <ProtectedRoute>
              <GamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/play/:gameId/replay"
          element={
            <ProtectedRoute>
              <GameReplayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-games"
          element={
            <ProtectedRoute>
              <MyGamesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppContent />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;