import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { UserProvider } from './context/UserContext';
import { TurnosProvider } from './context/TurnosContext';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <TurnosProvider>
        <App />
      </TurnosProvider>
    </UserProvider>
  </StrictMode>
);