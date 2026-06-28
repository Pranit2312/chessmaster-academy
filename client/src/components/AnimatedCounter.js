import React, { useRef, useEffect, useState } from 'react';

const AnimatedCounter = ({ target = 0, suffix = '', duration = 1200, enabled = true }) => {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(target);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        const startVal = 0;
        const startTime = performance.now();
        const frame = (now) => {
          const p = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const current = Math.floor(startVal + (target - startVal) * eased);
          setDisplayed(current);
          if (p < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, enabled, started]);

  return <span ref={ref}>{displayed}{suffix}</span>;
};

export default AnimatedCounter;
