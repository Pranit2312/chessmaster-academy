import React, { useState } from 'react';
import '../styles/AboutPage.css';

const ContactPage = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Contact Us</h1>
        <p>We're here to help with any questions or concerns</p>
      </div>

      <div className="static-content">
        <div className="contact-layout">
          <div className="contact-info">
            <section className="about-section">
              <h2>Get in Touch</h2>
              <div className="contact-details">
                <div className="contact-item">
                  <strong>Email Support</strong>
                  <p><a href="mailto:support@chessmaster.io">support@chessmaster.io</a></p>
                </div>
                <div className="contact-item">
                  <strong>Sales Inquiries</strong>
                  <p><a href="mailto:sales@chessmaster.io">sales@chessmaster.io</a></p>
                </div>
                <div className="contact-item">
                  <strong>Coach Partnerships</strong>
                  <p><a href="mailto:coaches@chessmaster.io">coaches@chessmaster.io</a></p>
                </div>
                <div className="contact-item">
                  <strong>Response Time</strong>
                  <p>We typically respond within 24 hours during business days.</p>
                </div>
              </div>
            </section>

            <section className="about-section">
              <h2>Support Resources</h2>
              <ul className="support-links">
                <li><a href="/help">Help Center</a> — Browse common questions and guides</li>
                <li><a href="/faq">FAQ</a> — Frequently asked questions</li>
                <li><a href="/forum">Community Forum</a> — Get help from other players</li>
              </ul>
            </section>
          </div>

          <div className="contact-form-wrapper">
            <section className="about-section">
              <h2>Send a Message</h2>
              {sent ? (
                <div className="success-message">
                  <p>Thank you for reaching out! We'll get back to you as soon as possible.</p>
                  <button className="btn btn-primary" onClick={() => setSent(false)}>Send Another Message</button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" required placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input id="email" type="email" required placeholder="your@email.com" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select id="subject" required defaultValue="">
                      <option value="" disabled>Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="coach">Become a Coach</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" rows={6} required placeholder="How can we help you?" />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
