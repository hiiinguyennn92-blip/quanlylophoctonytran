import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Prevent uncaught promise rejections from propagating as unhandled empty error objects
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('websocket') ||
      reasonStr.includes('closed without opened') ||
      reasonStr.includes('vite') ||
      reasonStr.includes('HMR')
    ) {
      // Benign Vite HMR WebSocket connection failure in proxy/sandbox environment - ignore per guidelines
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    console.warn('[Global Unhandled Rejection Caught]:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    const msg = String(event.message || '');
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('closed without opened') ||
      msg.includes('vite')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

