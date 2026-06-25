import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const CommunityPage = () => {
  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Community</h1>
        <p>Connect with chess players from around the world</p>
      </div>

      <div className="static-content">
        <div className="community-grid">
          <div className="community-card">
            <h3>💬 Forum</h3>
            <p>Discuss openings, tactics, endgames, and everything chess. Share your games for analysis and get feedback from the community.</p>
            <Link to="/forum" className="btn btn-primary">Visit Forum</Link>
          </div>

          <div className="community-card">
            <h3>🏆 Tournaments</h3>
            <p>Compete in online tournaments against players of all levels. Test your skills in rapid, blitz, and classical formats.</p>
            <Link to="/tournaments" className="btn btn-primary">View Tournaments</Link>
          </div>

          <div className="community-card">
            <h3>🎓 Find a Coach</h3>
            <p>Connect with expert coaches for personalized training. Browse profiles, read reviews, and book your first session.</p>
            <Link to="/browse-coaches" className="btn btn-primary">Browse Coaches</Link>
          </div>

          <div className="community-card">
            <h3>🤝 Play Games</h3>
            <p>Challenge other players to live games with various time controls. Improve your skills through practical play.</p>
            <Link to="/play" className="btn btn-primary">Play Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
