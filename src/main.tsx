import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign browser-level ResizeObserver loop notifications triggered by Recharts / WebGL renderers
const isResizeObserverError = (error: unknown): boolean => {
  if (!error) return false;
  const message = typeof error === 'string' ? error : (error as Error).message || '';
  return (
    message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded')
  );
};

window.addEventListener('error', (event) => {
  if (isResizeObserverError(event.message) || isResizeObserverError(event.error)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isResizeObserverError(event.reason)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

