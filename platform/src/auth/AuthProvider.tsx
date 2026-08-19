import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { App } from 'antd';
import { AuthContext } from './AuthContext';
import {
  clearToken,
  getToken,
  setRequestErrorNotifier,
  setToken,
  setUnauthorizedHandler,
} from '../services/http';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { message } = App.useApp();
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getToken()));

  useLayoutEffect(() => {
    setUnauthorizedHandler(() => setLoggedIn(false));
    setRequestErrorNotifier((content) => {
      message.error(content);
    });
    return () => {
      setUnauthorizedHandler(null);
      setRequestErrorNotifier(null);
    };
  }, [message]);

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
