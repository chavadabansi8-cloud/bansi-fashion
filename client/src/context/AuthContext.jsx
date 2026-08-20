import { createContext, useContext, useState, useEffect } from 'react';
import { APP_PANEL } from '../config/panel';

const AuthContext = createContext(null);

const storagePrefix = APP_PANEL === 'all' ? 'wt' : `wt_${APP_PANEL}`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(`${storagePrefix}_token`);
    const storedUser = localStorage.getItem(`${storagePrefix}_user`);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(`${storagePrefix}_token`, authToken);
    localStorage.setItem(`${storagePrefix}_user`, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(`${storagePrefix}_token`);
    localStorage.removeItem(`${storagePrefix}_user`);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
