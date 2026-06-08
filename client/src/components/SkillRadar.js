import React from 'react';

const SkillRadar = ({ assessment }) => {
  if (!assessment) return null;

  const skills = [
    { label: 'Opening', value: assessment.opening?.score || 0 },
    { label: 'Middlegame', value: assessment.middlegame?.score || 0 },
    { label: 'Endgame', value: assessment.endgame?.score || 0 },
    { label: 'Tactics', value: assessment.tactics?.score || 0 }
  ];

  return (
    <div className="skill-radar">
      <div className="skill-radar-header">
        <h3>Skill Assessment</h3>
        <div className="overall-score" style={{ color: assessment.overall?.color }}>
          <span className="overall-value">{assessment.overall?.score || '--'}</span>
          <span className="overall-label">{assessment.overall?.label || 'No Data'}</span>
        </div>
      </div>
      <div className="skill-bars">
        {skills.map((skill) => {
          const barColor = skill.value >= 80 ? '#22c55e' : skill.value >= 65 ? '#eab308' : skill.value >= 50 ? '#f97316' : '#ef4444';
          return (
            <div key={skill.label} className="skill-bar-item">
              <div className="skill-bar-label">
                <span>{skill.label}</span>
                <span style={{ color: barColor, fontWeight: 700 }}>{skill.value}%</span>
              </div>
              <div className="skill-bar-track">
                <div
                  className="skill-bar-fill"
                  style={{ width: `${skill.value}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="skill-bar-sub">
                {assessment[skill.label.toLowerCase()]?.label || ''}
              </div>
            </div>
          );
        })}
      </div>
      <div className="skill-stats">
        <div className="skill-stat">
          <span className="stat-value">{assessment.totalGames || 0}</span>
          <span className="stat-label">Games Analyzed</span>
        </div>
        <div className="skill-stat">
          <span className="stat-value">{assessment.botGamesPlayed || 0}</span>
          <span className="stat-label">AI Practice Games</span>
        </div>
        <div className="skill-stat">
          <span className="stat-value">{assessment.coursesInProgress || 0}</span>
          <span className="stat-label">Courses Active</span>
        </div>
        <div className="skill-stat">
          <span className="stat-value">{assessment.coursesCompleted || 0}</span>
          <span className="stat-label">Courses Done</span>
        </div>
      </div>
    </div>
  );
};

export default SkillRadar;
