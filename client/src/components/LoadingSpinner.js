import React from 'react';
import '../styles/LoadingSpinner.css'; // optional if you style separately

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner;