import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const CareersPage = () => {
  const roles = [
    {
      title: 'Senior Chess Coach',
      type: 'Full-time / Remote',
      description: 'Join our coaching team to provide one-on-one and group lessons to students worldwide. Must have a FIDE rating of 2200+ and teaching experience.'
    },
    {
      title: 'Software Engineer — Full Stack',
      type: 'Full-time / Remote',
      description: 'Build and maintain the ChessMaster platform. Experience with React, Node.js, MongoDB, and chess programming is a plus.'
    },
    {
      title: 'Community Manager',
      type: 'Full-time / Remote',
      description: 'Manage our growing community of chess enthusiasts. Organize events, moderate forums, and engage with players across social media.'
    },
    {
      title: 'Content Creator — Chess Education',
      type: 'Contract / Remote',
      description: 'Create high-quality educational content including video lessons, articles, and training materials for players of all levels.'
    }
  ];

  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Careers at ChessMaster</h1>
        <p>Help us build the future of chess education</p>
      </div>

      <div className="static-content">
        <section className="about-section">
          <h2>Why Join ChessMaster?</h2>
          <p>
            ChessMaster Academy is at the intersection of chess and technology. We're building a platform 
            that makes expert coaching accessible to millions of players. Our team includes chess 
            professionals, software engineers, and education specialists who share a passion for the game.
          </p>
          <div className="about-grid" style={{ marginTop: 'var(--8)' }}>
            <div className="about-card">
              <h3>Remote-First</h3>
              <p>Work from anywhere in the world. Our team spans multiple continents and time zones.</p>
            </div>
            <div className="about-card">
              <h3>Growth Opportunities</h3>
              <p>We invest in our team's professional development through learning budgets, conferences, and mentorship.</p>
            </div>
            <div className="about-card">
              <h3>Competitive Compensation</h3>
              <p>We offer salaries and equity that reflect the value you bring to the team.</p>
            </div>
            <div className="about-card">
              <h3>Impact at Scale</h3>
              <p>Your work will help thousands of chess players improve their game every day.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Open Positions</h2>
          {roles.length === 0 ? (
            <p>No open positions at this time. Check back soon or follow us on social media for updates.</p>
          ) : (
            <div className="careers-list">
              {roles.map((role, i) => (
                <div key={i} className="career-card">
                  <div className="career-header">
                    <h3>{role.title}</h3>
                    <span className="career-type">{role.type}</span>
                  </div>
                  <p>{role.description}</p>
                  <button className="btn btn-sm btn-outline" onClick={() => alert('Applications are currently being reviewed. Please email careers@chessmaster.io with your resume.')}>Apply Now</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="about-section">
          <h2>Don't See a Fit?</h2>
          <p>We're always looking for talented individuals. Send your resume to <a href="mailto:careers@chessmaster.io">careers@chessmaster.io</a> and we'll keep you in mind for future opportunities.</p>
          <div className="about-cta">
            <Link to="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CareersPage;
