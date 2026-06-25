import React from 'react';
import '../styles/AboutPage.css';

const TermsPage = () => {
  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Terms of Service</h1>
        <p>Last updated: June 2024</p>
      </div>

      <div className="static-content legal-content">
        <section className="about-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using ChessMaster Academy ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.</p>
        </section>

        <section className="about-section">
          <h2>2. Account Registration</h2>
          <p>You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials. All activity under your account is your responsibility. You must provide accurate and complete information during registration.</p>
        </section>

        <section className="about-section">
          <h2>3. Coaching Services</h2>
          <p>Coaches on the Platform are independent contractors, not employees of ChessMaster Academy. Session quality and content are the responsibility of the individual coach. ChessMaster Academy facilitates connections but does not guarantee specific outcomes.</p>
        </section>

        <section className="about-section">
          <h2>4. Payments and Refunds</h2>
          <p>All payments are processed through our secure payment gateway. Session fees are charged at the time of booking. Refunds for cancelled sessions are provided according to our Refund Policy: full refund for cancellations made 24+ hours before the session; no refund for late cancellations or no-shows.</p>
        </section>

        <section className="about-section">
          <h2>5. User Conduct</h2>
          <p>You agree not to: use the Platform for any unlawful purpose, harass or abuse coaches or other users, attempt to circumvent payment systems, share account credentials with others, or engage in any activity that disrupts the Platform's operation.</p>
        </section>

        <section className="about-section">
          <h2>6. Intellectual Property</h2>
          <p>The Platform, including its code, design, and content, is owned by ChessMaster Academy. Course materials are the intellectual property of their respective creators. You may not reproduce, distribute, or create derivative works without permission.</p>
        </section>

        <section className="about-section">
          <h2>7. Limitation of Liability</h2>
          <p>ChessMaster Academy provides the Platform "as is" without warranties of any kind. We are not liable for damages arising from use of the Platform, including but not limited to direct, indirect, incidental, or consequential damages.</p>
        </section>

        <section className="about-section">
          <h2>8. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their account at any time through account settings or by contacting support.</p>
        </section>

        <section className="about-section">
          <h2>9. Governing Law</h2>
          <p>These terms are governed by the laws of India. Any disputes shall be resolved through binding arbitration in accordance with the Arbitration and Conciliation Act, 1996.</p>
        </section>

        <section className="about-section">
          <h2>10. Changes to Terms</h2>
          <p>We may modify these terms at any time. Users will be notified of material changes via email or platform notification. Continued use after changes constitutes acceptance of the modified terms.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
