import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedCard.css';

const AnimatedCard = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      className={`animated-card ${className}`}
      initial={{ 
        opacity: 0, 
        y: 30,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: {
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          duration: 0.1
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedStatCard = ({ icon, value, label, type, trend, delay = 0 }) => {
  return (
    <motion.div
      className="animated-stat-card"
      initial={{ 
        opacity: 0, 
        y: 20,
        scale: 0.9
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        y: -6,
        scale: 1.03,
        transition: {
          duration: 0.2,
          ease: "easeOut"
        }
      }}
    >
      <motion.div
        className="stat-icon"
        animate={{
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        }}
      >
        {icon}
      </motion.div>
      
      <motion.div
        className="stat-value"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {value}
      </motion.div>
      
      <div className="stat-label">{label}</div>
      
      {trend && (
        <motion.div
          className={`stat-trend ${trend > 0 ? 'positive' : 'negative'}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.3 }}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </motion.div>
      )}
    </motion.div>
  );
};

export const AnimatedButton = ({ children, onClick, variant = 'primary', className = '', delay = 0 }) => {
  return (
    <motion.button
      className={`animated-button btn-${variant} ${className}`}
      onClick={onClick}
      initial={{ 
        opacity: 0, 
        scale: 0.9
      }}
      animate={{ 
        opacity: 1, 
        scale: 1
      }}
      transition={{
        duration: 0.4,
        delay: delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{
        scale: 1.05,
        transition: {
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      whileTap={{
        scale: 0.95,
        transition: {
          duration: 0.1
        }
      }}
    >
      {children}
    </motion.button>
  );
};

export const CountUpAnimation = ({ value, duration = 1.5, delay = 0 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration, delay]);

  return <span>{displayValue}</span>;
};

export default AnimatedCard;
