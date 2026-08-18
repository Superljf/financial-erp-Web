import { useMemo, useState, type ReactNode } from 'react';
import type { Company } from '../types';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const value = useMemo(
    () => ({
      company,
      login: (c: Company) => setCompany(c),
      logout: () => setCompany(null),
    }),
    [company],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
