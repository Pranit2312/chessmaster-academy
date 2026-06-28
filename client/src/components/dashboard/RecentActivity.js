import React from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'puzzle',
      icon: '🧩',
      title: 'Solved a puzzle',
      description: 'Tactical puzzle #1234',
      points: '+15',
      time: '2 hours ago',
      color: 'green'
    },
    {
      id: 2,
      type: 'tournament',
      icon: '🏆',
      title: 'Won a tournament',
      description: 'Blitz Arena #45',
      points: '+100',
      time: '5 hours ago',
      color: 'orange'
    },
    {
      id: 3,
      type: 'course',
      icon: '📚',
      title: 'Completed course',
      description: 'Endgame Fundamentals',
      points: '+50',
      time: '1 day ago',
      color: 'blue'
    },
    {
      id: 4,
      type: 'analysis',
      icon: '🔍',
      title: 'Analyzed a game',
      description: 'vs Grandmaster',
      points: '+10',
      time: '2 days ago',
      color: 'purple'
    }
  ];

  const getColorClass = (color) => {
    switch (color) {
      case 'green': return 'activity-green';
      case 'orange': return 'activity-orange';
      case 'blue': return 'activity-blue';
      case 'purple': return 'activity-purple';
      default: return 'activity-blue';
    }
  };

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <button className="btn btn-ghost btn-sm">View All</button>
      </div>

      <div className="activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className={`activity-item ${getColorClass(activity.color)}`}>
            <div className="activity-icon">{activity.icon}</div>
            <div className="activity-details">
              <h4 className="activity-title">{activity.title}</h4>
              <p className="activity-description">{activity.description}</p>
              <span className="activity-time">{activity.time}</span>
            </div>
            <div className="activity-points">{activity.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
