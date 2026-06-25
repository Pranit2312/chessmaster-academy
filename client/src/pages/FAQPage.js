import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  const sections = [
    {
      title: 'Coaching Questions',
      questions: [
        { q: 'How do I choose the right coach?', a: 'Browse coach profiles to see their ratings, experience, specializations, and pricing. You can also read reviews from other students. Many coaches offer an introductory session at a reduced rate so you can find the right fit.' },
        { q: 'What should I expect in my first session?', a: 'Your coach will typically assess your current level, discuss your goals, and create a training plan. Be prepared to share your chess background, rating (if any), and areas you want to improve.' },
        { q: 'How often should I take lessons?', a: 'Most students benefit from weekly sessions, with additional self-study time between lessons. Consistency is more important than frequency — even bi-weekly sessions produce significant improvement when combined with regular practice.' },
        { q: 'Can I switch coaches?', a: 'Yes, you can book sessions with any coach at any time. We encourage finding a coach whose teaching style matches your learning preferences.' },
        { q: 'What equipment do I need for online coaching?', a: 'A computer or tablet with a stable internet connection. A webcam and microphone are recommended for interactive sessions. No physical chess board is needed — our platform includes an interactive board.' }
      ]
    },
    {
      title: 'Payment Questions',
      questions: [
        { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards (Visa, Mastercard, Amex), UPI, net banking, and various digital wallets depending on your region.' },
        { q: 'How does billing work?', a: 'You are charged per session at the time of booking. There are no subscriptions or recurring fees unless you choose a prepaid package with your coach.' },
        { q: 'Can I get a refund?', a: 'Sessions cancelled at least 24 hours before the start time receive a full refund. Late cancellations and no-shows are non-refundable.' },
        { q: 'Do you offer discounts for package bookings?', a: 'Many coaches offer discounted rates for booking multiple sessions in advance. Package pricing is displayed on each coach\'s profile page.' },
        { q: 'Is my payment information secure?', a: 'Yes, all payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your full card details on our servers.' }
      ]
    },
    {
      title: 'Course Questions',
      questions: [
        { q: 'How are courses structured?', a: 'Courses are divided into chapters, each containing video lessons, written materials, and practice exercises. Quizzes at the end of each chapter test your understanding.' },
        { q: 'Can I preview a course before buying?', a: 'Yes, each course has a free preview section that includes the first lesson and a course overview so you can evaluate the content and teaching style.' },
        { q: 'Do courses have expiration dates?', a: 'Once purchased, courses are available for life. You can learn at your own pace and revisit materials anytime.' },
        { q: 'Are there prerequisites for advanced courses?', a: 'Advanced courses may recommend minimum rating levels or completion of prerequisite courses. Check the course description for requirements.' },
        { q: 'Can coaches create their own courses?', a: 'Yes, certified coaches can create and publish courses through our platform. Contact us to apply for the coach program.' }
      ]
    },
    {
      title: 'Tournament Questions',
      questions: [
        { q: 'How do tournaments work?', a: 'Tournaments are online events where players compete in a structured format. Pairings are generated automatically, and games are played on our platform with built-in clocks.' },
        { q: 'Are tournaments rated?', a: 'Our internal tournament ratings help match you with players of similar strength. Some tournaments may also be FIDE-rated depending on the event.' },
        { q: 'What time controls are used?', a: 'Time controls vary by tournament. Common formats include 10+0 (rapid), 15+10 (rapid with increment), and 5+3 (blitz). Check the tournament details for specifics.' },
        { q: 'Can I play in tournaments for free?', a: 'We offer both free and entry-fee tournaments. Free tournaments are a great way to gain experience, while entry-fee tournaments typically have prize pools.' }
      ]
    },
    {
      title: 'Technical Questions',
      questions: [
        { q: 'Which browsers are supported?', a: 'We support the latest versions of Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.' },
        { q: 'Is there a mobile app?', a: 'Our platform is fully responsive and works on mobile browsers. A dedicated mobile app is under development.' },
        { q: 'How do I report a technical issue?', a: 'Contact our support team at support@chessmaster.io with a description of the issue, your browser and OS, and any error messages or screenshots.' }
      ]
    }
  ];

  return (
    <div className="static-page about-page">
      <div className="static-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Quick answers to the most common questions about ChessMaster Academy</p>
      </div>

      <div className="static-content">
        {sections.map((section, i) => (
          <section key={i} className="about-section">
            <h2>{section.title}</h2>
            <div className="faq-list">
              {section.questions.map((item, j) => {
                const idx = `${i}-${j}`;
                return (
                  <div key={j} className={`faq-item ${openIndex === idx ? 'open' : ''}`}>
                    <button className="faq-question" onClick={() => toggle(idx)}>
                      <span>{item.q}</span>
                      <span className="faq-arrow">{openIndex === idx ? '−' : '+'}</span>
                    </button>
                    {openIndex === idx && (
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="about-section">
          <h2>Didn't Find Your Answer?</h2>
          <div className="about-cta">
            <Link to="/contact" className="btn btn-primary">Contact Support</Link>
            <Link to="/help" className="btn btn-outline">Visit Help Center</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
