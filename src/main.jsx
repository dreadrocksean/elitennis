import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { initSentry } from './lib/sentry';
import './index.css';

initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Analytics />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#14401f',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: { iconTheme: { primary: '#e7f24b', secondary: '#14401f' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
