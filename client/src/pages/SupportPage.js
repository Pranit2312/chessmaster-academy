import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const SupportPage = () => {
  const issues = [
    {
      title: 'Platform Access',
      items: [
        'Cannot log in — Use the "Forgot Password" option on the login page. If you still have trouble, contact support.',
        'Account locked — After multiple failed login attempts, your account may be temporarily locked. Wait 15 minutes and try again.',
        'Browser compatibility — We support the latest versions of Chrome, Firefox, Safari, and Edge.'
      ]
    },
    {
      title: 'Payments & Billing',
      items: [
        'Payment declined — Verify your card details and ensure sufficient funds. Contact your bank if the issue persists.',
        'Refund request — Refunds are processed within 5-7 business days. Check our Refund Policy for eligibility.',
        'Receipt not received — Check your spam folder. Receipts are sent immediately after payment confirmation.'
      ]
    },
    {
      title: 'Session Issues',
      items: [
        'Coach did not show — If your coach does not join within 10 minutes, the session is marked as missed and you receive a full refund.',
        'Connection problems during session — Check your internet connection and camera/microphone settings.',
        'Session not showing in history — Refresh the page. If it still does not appear, contact support with the session time.'
      ]
    },
    {
      title: 'Feature Requests',
      items: [
        'Request a new feature — Share your ideas on our Community Forum. The most popular requests are added to our roadmap.',
        'Report a bug — Email bug reports to support@chessmaster.io with steps to reproduce the issue and your browser/OS details.'
      ]
    }
  ];

  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Support</h1>
        <p>Get help with platform issues, billing, and technical problems</p>
      </div>

      <div className="static-content">
        <div className="support-channels">
          <div className="support-channel-card">
            <h3>📧 Email Support</h3>
            <p><a href="mailto:support@chessmaster.io">support@chessmaster.io</a></p>
            <p>Response within 24 hours</p>
          </div>
          <div className="support-channel-card">
            <h3>💬 Live Chat</h3>
            <p>Available during business hours (Mon-Fri, 9 AM - 6 PM EST)</p>
          </div>
          <div className="support-channel-card">
            <h3>📖 Help Center</h3>
            <p><Link to="/help">Browse guides and tutorials</Link></p>
          </div>
        </div>

        {issues.map((section, i) => (
          <section key={i} className="about-section">
            <h2>{section.title}</h2>
            <div className="help-list">
              {section.items.map((item, j) => (
                <div key={j} className="help-item">
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="about-section">
          <h2>Still Unresolved?</h2>
          <p>Our support team monitors all channels during business hours and prioritizes urgent issues.</p>
          <div className="about-cta">
            <Link to="/contact" className="btn btn-primary">Contact Support Team</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupportPage;
