import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { UserProvider } from './context/UserContext';
import { TurnosProvider } from './context/TurnosContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <TurnosProvider>
        <App />
      </TurnosProvider>
    </UserProvider>
  </StrictMode>
);