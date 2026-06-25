import React from 'react';
import '../styles/AboutPage.css';

const PrivacyPage = () => {
  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2024</p>
      </div>

      <div className="static-content legal-content">
        <section className="about-section">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account, including your name, email address, and profile information. During coaching sessions, we may record session content for quality and training purposes. Payment information is processed by our payment provider and is not stored on our servers.</p>
        </section>

        <section className="about-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to provide and improve our coaching services, process payments, communicate with you about your account and sessions, send occasional service updates, and analyze platform usage to improve user experience.</p>
        </section>

        <section className="about-section">
          <h2>3. Data Sharing</h2>
          <p>We do not sell your personal information to third parties. We may share your information with coaches you book sessions with, payment processors for transaction handling, and service providers who assist in platform operations. All third parties are bound by confidentiality agreements.</p>
        </section>

        <section className="about-section">
          <h2>4. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit (TLS 1.3), encrypted data storage, regular security audits, and access controls on all systems containing personal data.</p>
        </section>

        <section className="about-section">
          <h2>5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data at any time through your account settings. You may export your data or request account deletion by contacting our support team. We will respond to all data requests within 30 days.</p>
        </section>

        <section className="about-section">
          <h2>6. Cookies</h2>
          <p>We use essential cookies for authentication and platform functionality. Analytics cookies help us understand how the platform is used. You can control cookie preferences through your browser settings.</p>
        </section>

        <section className="about-section">
          <h2>7. Children's Privacy</h2>
          <p>Our services are intended for users aged 13 and above. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal data, please contact us immediately.</p>
        </section>

        <section className="about-section">
          <h2>8. Changes to This Policy</h2>
          <p>We may update this privacy policy periodically. Material changes will be communicated via email or platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section className="about-section">
          <h2>9. Contact</h2>
          <p>For privacy-related inquiries, contact our Data Protection Officer at privacy@chessmaster.io or through our <a href="/contact">Contact page</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
