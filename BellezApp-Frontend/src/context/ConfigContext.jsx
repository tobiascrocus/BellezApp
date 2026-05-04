import { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext(null);

const DEFAULT_CONFIG = {
  timeZone: 'America/Argentina/Buenos_Aires',
  businessHours: [{ start: 9, end: 12 }, { start: 17, end: 21 }],
  slotInterval: 30
};

const fetchWithRetry = async (url, retries = 3, interval = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchWithRetry('/api/config');
        setConfig(data);
      } catch (err) {
        console.warn('Error cargando configuración tras varios reintentos. Usando configuración por defecto.', err);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando configuración...</div>;
  }

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => useContext(ConfigContext);