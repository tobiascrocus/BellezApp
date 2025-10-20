// UserContext.jsx
import { createContext } from "react";

export const UserContext = createContext({
  user: null,
  setUser: () => {},
  token: null,
  login: async () => {},
  logout: () => {},
  authFetch: async () => {},
  updateUser: () => {},
  loading: false
});