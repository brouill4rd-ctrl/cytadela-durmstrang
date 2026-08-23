import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SchoolProvider } from './context/SchoolContext';
import { SoundProvider } from './context/SoundContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SchoolProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
      </SchoolProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
