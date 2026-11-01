import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const SESSION_KEY = 'pb_auth_session';
const INTRO_KEY = 'pb_intro_seen';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.user && session?.token) {
          setUser(session.user);
          setToken(session.token);
        }
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  const persistSession = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, token: t }));
  };

  /**
   * Real login: accepts any non-empty email + password (min 6 chars).
   * Stores the session locally — backend has no auth endpoint.
   */
  const login = useCallback(async (email, password) => {
    await new Promise((r) => setTimeout(r, 300));
    const e = (email || '').trim().toLowerCase();
    const p = (password || '');
    if (!e || !e.includes('@')) throw new Error('Enter a valid email address.');
    if (p.length < 6) throw new Error('Password must be at least 6 characters.');
    const u = { id: `user-${Date.now()}`, name: e.split('@')[0], email: e, role: 'Admin' };
    const t = `token-${Date.now()}`;
    persistSession(u, t);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    await new Promise((r) => setTimeout(r, 300));
    const e = (email || '').trim().toLowerCase();
    const p = (password || '');
    const n = (name || '').trim();
    if (!n) throw new Error('Name is required.');
    if (!e || !e.includes('@')) throw new Error('Enter a valid email address.');
    if (p.length < 6) throw new Error('Password must be at least 6 characters.');
    const u = { id: `user-${Date.now()}`, name: n, email: e, role: 'Developer' };
    const t = `token-${Date.now()}`;
    persistSession(u, t);
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(INTRO_KEY);
  }, []);

  const isAdmin = user?.role === 'Admin';

  const introSeen = () => localStorage.getItem(INTRO_KEY) === 'true';
  const markIntroSeen = () => localStorage.setItem(INTRO_KEY, 'true');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAdmin, introSeen, markIntroSeen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
