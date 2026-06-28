import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TournamentCard.css';

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();

  if (!tournament) {
    return null;
  }

  const handleRegister = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  return (
    <div className="tournament-card">
      <div className="tournament-header">
        <div className="tournament-badge">🏆 Featured</div>
        <div className="tournament-type">{tournament.type || 'Rapid'}</div>
      </div>

      <h3 className="tournament-title">{tournament.name}</h3>
      
      <div className="tournament-details">
        <div className="tournament-detail">
          <span className="detail-icon">⏱️</span>
          <span>{tournament.timeControl || '10+0'}</span>
        </div>
        <div className="tournament-detail">
          <span className="detail-icon">👥</span>
          <span>{tournament.players || 16} Players</span>
        </div>
        <div className="tournament-detail">
          <span className="detail-icon">🎯</span>
          <span>{tournament.minRating || '1500+'} Rating</span>
        </div>
      </div>

      <div className="tournament-timer">
        <span className="timer-label">Starts in</span>
        <span className="timer-value">{tournament.timeRemaining || '02h:15m:42s'}</span>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleRegister}>
        Register Now
      </button>

      <div className="tournament-footer">
        <span className="footer-text">Upcoming Tournaments</span>
        <span className="footer-link" onClick={() => navigate('/tournaments')}>View All →</span>
      </div>
    </div>
  );
};

export default TournamentCard;
