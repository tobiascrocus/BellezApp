import { createContext, useState } from 'react';

export const TurnosContext = createContext();

export function TurnosProvider({ children }) {
  const [turnos, setTurnos] = useState([]);

  return (
    <TurnosContext.Provider value={{ turnos, setTurnos }}>
      {children}
    </TurnosContext.Provider>
  );
}