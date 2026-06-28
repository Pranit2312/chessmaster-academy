import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Sidebar from "../components/layout/Sidebar";
import TopNavigation from "../components/layout/TopNavigation";
import HeroSection from "../components/premium/HeroSection";
import AnimatedBackground from "../components/premium/AnimatedBackground";
import AnimatedCard, { AnimatedStatCard } from "../components/premium/AnimatedCard";
import DailyPuzzle from "../components/dashboard/DailyPuzzle";
import RecentActivity from "../components/dashboard/RecentActivity";
import TournamentCard from "../components/dashboard/TournamentCard";
import CourseCard from "../components/dashboard/CourseCard";
import ProgressSection from "../components/dashboard/ProgressSection";
import "../styles/modern-theme.css";
import "./StudentDashboardNew.css";

const StudentDashboardNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    chessRating: 1456,
    puzzlesSolved: 24,
    tournaments: 8,
    courses: 4
  });
  const [tournament, setTournament] = useState(null);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [upcomingArena, setUpcomingArena] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user stats
      const statsResponse = await axios.get('/api/student/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch active tournament
      const tournamentResponse = await axios.get('/api/tournaments/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tournamentResponse.data && tournamentResponse.data.length > 0) {
        setTournament(tournamentResponse.data[0]);
      }

      // Fetch enrolled courses
      const coursesResponse = await axios.get('/api/student/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (coursesResponse.data && coursesResponse.data.length > 0) {
        setCourse(coursesResponse.data[0]);
      }

      // Fetch progress data
      const progressResponse = await axios.get('/api/student/progress', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (progressResponse.data) {
        setProgress(progressResponse.data);
      }

      // Fetch upcoming arena
      const arenaResponse = await axios.get('/api/tournaments/upcoming', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (arenaResponse.data) {
        setUpcomingArena(arenaResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleJoinArena = (arenaId) => {
    navigate(`/tournament/${arenaId}`);
  };

  return (
    <div className="dashboard-layout">
      <AnimatedBackground />
      <Sidebar />
      <div className="dashboard-main">
        <TopNavigation />
        
        <div className="dashboard-content">
          {/* Hero Section */}
          <HeroSection />

          {/* Welcome Section */}
          <div className="welcome-section animate-fade-in">
            <h1>Welcome back, {user?.name || 'Arjun'}!</h1>
            <p className="welcome-subtitle">Continue your chess learning journey</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid animate-slide-in">
            <AnimatedStatCard 
              icon="📈" 
              value={stats.chessRating} 
              label="Your Rating" 
              type="rating"
              trend={12}
              delay={0}
            />
            <AnimatedStatCard 
              icon="🧩" 
              value={stats.puzzlesSolved} 
              label="Puzzles Solved" 
              type="puzzles"
              trend={8}
              delay={0.1}
            />
            <AnimatedStatCard 
              icon="🏆" 
              value={stats.tournaments} 
              label="Tournaments" 
              type="tournaments"
              trend={25}
              delay={0.2}
            />
            <AnimatedStatCard 
              icon="📚" 
              value={stats.courses} 
              label="Courses" 
              type="courses"
              trend={5}
              delay={0.3}
            />
          </div>

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-left">
              {/* Daily Puzzle */}
              <AnimatedCard delay={0.4}>
                <DailyPuzzle />
              </AnimatedCard>

              {/* Recent Activity */}
              <AnimatedCard delay={0.5}>
                <RecentActivity />
              </AnimatedCard>

              {/* Progress Section */}
              <AnimatedCard delay={0.6}>
                <ProgressSection progress={progress} />
              </AnimatedCard>
            </div>

            {/* Right Column */}
            <div className="dashboard-right">
              {/* Tournament Card - Only show if tournament exists */}
              {loading ? (
                <div className="loading-skeleton" />
              ) : tournament ? (
                <AnimatedCard delay={0.7}>
                  <TournamentCard tournament={tournament} />
                </AnimatedCard>
              ) : null}

              {/* Course Card - Only show if course exists */}
              {loading ? (
                <div className="loading-skeleton" />
              ) : course ? (
                <AnimatedCard delay={0.8}>
                  <CourseCard 
                    course={course} 
                    onContinue={handleContinueCourse}
                  />
                </AnimatedCard>
              ) : null}

              {/* Join Rapid Arena - Only show if arena exists */}
              {loading ? (
                <div className="loading-skeleton" />
              ) : upcomingArena ? (
                <AnimatedCard delay={0.9}>
                  <div className="join-arena-card">
                    <div className="arena-header">
                      <span className="arena-icon">⚡</span>
                      <h3>{upcomingArena.name}</h3>
                    </div>
                    <div className="arena-timer">
                      Next tournament starts in
                      <span className="timer-value">{upcomingArena.timeRemaining}</span>
                    </div>
                    <button 
                      className="btn btn-success btn-block"
                      onClick={() => handleJoinArena(upcomingArena.id)}
                    >
                      Join Now
                    </button>
                  </div>
                </AnimatedCard>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardNew;
