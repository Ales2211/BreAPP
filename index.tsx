import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Corrected import path for App component from 'App' to './App'.
import App from './App';
import { LanguageProvider } from './hooks/useTranslation';
import { ToastProvider } from './hooks/useToast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);