import { createContext, useContext } from 'react';
import type { Company } from '../types';

export interface AuthState {
  company: Company | null;
  login: (company: Company) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
