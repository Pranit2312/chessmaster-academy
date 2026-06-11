import React, { useState, useEffect } from 'react';
import { puzzleAPI, enrollmentAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

export default function StudentAnalytics() {
  const [puzzleProfile, setPuzzleProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      puzzleAPI.getProfile().catch(() => null),
      enrollmentAPI.getMyEnrollments().catch(() => null)
    ]).then(([pRes, eRes]) => {
      setPuzzleProfile(pRes?.data?.profile || null);
      setEnrollments(eRes?.data?.enrollments || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="tournaments-page"><p>Loading...</p></div>;

  const completedCourses = enrollments.filter(e => e.progressPercentage >= 100);
  const puzzleAccuracy = puzzleProfile ? (puzzleProfile.correctCount / (puzzleProfile.solvedCount || 1) * 100).toFixed(1) : 0;

  return (
    <div className="tournaments-page">
      <h1>My Analytics</h1>
      <div className="tp-stats-row">
        <div className="tp-stat"><span className="tp-stat-num">{enrollments.length}</span> Courses Enrolled</div>
        <div className="tp-stat"><span className="tp-stat-num">{completedCourses.length}</span> Courses Completed</div>
        <div className="tp-stat"><span className="tp-stat-num">{puzzleProfile?.solvedCount || 0}</span> Puzzles Solved</div>
        <div className="tp-stat"><span className="tp-stat-num">{puzzleAccuracy}%</span> Puzzle Accuracy</div>
        <div className="tp-stat"><span className="tp-stat-num">{puzzleProfile?.puzzleRating || 1200}</span> Puzzle Rating</div>
      </div>
    </div>
  );
}
