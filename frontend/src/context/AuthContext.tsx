import { createContext, useContext, useState } from 'react';
import type { AuthContextValue, AuthUser } from '../types/types';

const API = 'http://localhost:8000';

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredAuth(): { token: string; email: string } | null {
  const stored = localStorage.getItem('hermes_auth');
  return stored
    ? (JSON.parse(stored) as { token: string; email: string })
    : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const auth = getStoredAuth();
    return auth ? { email: auth.email } : null;
  });
  const [token, setToken] = useState<string | null>(
    () => getStoredAuth()?.token ?? null,
  );

  function persist(token: string, email: string) {
    localStorage.setItem('hermes_auth', JSON.stringify({ token, email }));
    setToken(token);
    setUser({ email });
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ?? 'Login failed');
    }
    const data = await res.json();
    persist(data.access_token, email);
  }

  async function register(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
  ) {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail ?? 'Registration failed');
    }
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem('hermes_auth');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
