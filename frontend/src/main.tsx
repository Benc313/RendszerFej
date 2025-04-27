import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications'; // Import
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx';
import './index.css'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; // Import notification styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <Notifications position="top-right" /> {/* Add Notifications provider */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
