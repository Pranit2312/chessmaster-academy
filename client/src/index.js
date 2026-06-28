import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import './styles/modern-theme.css';
import './styles/glassmorphism.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
