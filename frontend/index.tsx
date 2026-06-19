import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '16px',
              background: '#1e293b',
              color: '#f8fafc',
              fontWeight: 500,
              padding: '12px 18px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);