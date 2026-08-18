import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../services/http';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));

  useEffect(() => {
    setUnauthorizedHandler(() => setLoggedIn(false));
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      loggedIn,
      login: (token: string) => {
        setToken(token);
        setLoggedIn(true);
      },
      logout: () => {
        clearToken();
        setLoggedIn(false);
      },
    }),
    [loggedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
