import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const HelpPage = () => {
  const categories = [
    {
      title: 'Account Help',
      icon: '👤',
      items: [
        'How do I create an account? Click "Register" and fill in your details. You can sign up as a student or coach.',
        'How do I reset my password? Go to the login page and click "Forgot Password" to receive a reset link.',
        'How do I update my profile? Navigate to your Profile page from the dashboard menu to edit your information.',
        'How do I change my email address? Contact support to request an email change.'
      ]
    },
    {
      title: 'Booking Help',
      icon: '📅',
      items: [
        'How do I book a session? Browse coaches, select one, choose an available time slot, and confirm your booking.',
        'How do I cancel a booking? Go to My Bookings and click Cancel on any upcoming session.',
        'What is the cancellation policy? Sessions can be cancelled up to 24 hours before the start time for a full refund.',
        'How do I reschedule? Cancel the existing booking and create a new one with the updated time.'
      ]
    },
    {
      title: 'Course Help',
      icon: '📚',
      items: [
        'How do I enroll in a course? Browse the Courses page and click Enroll on any course you wish to take.',
        'How do I track my progress? Your course dashboard shows completed lessons, quiz scores, and overall progress.',
        'Can I access course materials offline? Course videos and resources require an internet connection to access.',
        'How do I get a certificate? Complete all lessons and pass the final assessment to earn your certificate.'
      ]
    },
    {
      title: 'Puzzle Help',
      icon: '🧩',
      items: [
        'How do puzzles work? You are shown a position and must find the best move. Drag a piece to make your move.',
        'What is Puzzle Rush? A timed mode where you solve as many puzzles as possible within a set time limit.',
        'How is my puzzle rating calculated? Your rating adjusts based on correct and incorrect solutions, similar to chess rating systems.',
        'Why does the board flip? The board always shows white at the bottom. The side to move is indicated by the label above the board.'
      ]
    },
    {
      title: 'Technical Issues',
      icon: '⚙️',
      items: [
        'The board is not responding. Try refreshing the page. If the issue persists, clear your browser cache.',
        'Videos are not loading. Check your internet connection and try disabling any ad blockers.',
        'I see an error message. Take a screenshot and email it to support@chessmaster.io with a description of what you were doing.',
        'The site is slow. Close unnecessary browser tabs and check your internet speed.'
      ]
    }
  ];

  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Help Center</h1>
        <p>Find answers to common questions and learn how to get the most out of ChessMaster</p>
      </div>

      <div className="static-content">
        {categories.map((cat, i) => (
          <section key={i} className="about-section">
            <h2>{cat.icon} {cat.title}</h2>
            <div className="help-list">
              {cat.items.map((item, j) => (
                <div key={j} className="help-item">
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="about-section">
          <h2>Still Need Help?</h2>
          <p>If you couldn't find what you were looking for, our support team is ready to assist.</p>
          <div className="about-cta">
            <Link to="/contact" className="btn btn-primary">Contact Support</Link>
            <Link to="/faq" className="btn btn-outline">View FAQ</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
