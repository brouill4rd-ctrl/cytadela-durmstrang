// Global design system FIRST so co-located component stylesheets
// (Navbar.css, MonumentalHero.css, …) reliably layer on top of it.
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { SchoolProvider } from './context/SchoolContext';
import { SoundProvider } from './context/SoundContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorldStateProvider } from './context/WorldStateContext';
import { BeltProvider } from './context/BeltContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SchoolProvider>
        <WorldStateProvider><SoundProvider><BeltProvider><App /></BeltProvider></SoundProvider></WorldStateProvider>
      </SchoolProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
