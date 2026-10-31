import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockUsers } from '../data/mockUsers';

const AuthContext = createContext(null);
const SESSION_KEY = 'pb_auth_session';
const USERS_KEY = 'pb_auth_users';
const INTRO_KEY = 'pb_intro_seen';

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  return [...mockUsers];
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
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

  const login = useCallback(async (email, password) => {
    await new Promise((r) => setTimeout(r, 600));
    if (email.trim().toLowerCase() !== 'xyz@gmail.com' || password !== '12345678') {
      throw new Error('Invalid demo credentials. Use xyz@gmail.com / 12345678.');
    }
    const found = users.find((u) => u.email.toLowerCase() === 'xyz@gmail.com') || { id: 'demo-user', name: 'Demo User', email: 'xyz@gmail.com', role: 'Admin' };
    const t = `demo-token-${Date.now()}`;
    persistSession(found, t);
    return found;
  }, [users]);

  const signup = useCallback(async (name, email, password) => {
    await new Promise((r) => setTimeout(r, 700));
    const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) throw new Error('An account with this email already exists.');
    const newUser = { id: `u-${Date.now()}`, name: name.trim(), email: email.trim(), role: 'Developer' };
    const next = [newUser, ...users];
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    const t = `demo-token-${Date.now()}`;
    persistSession(newUser, t);
    return newUser;
  }, [users]);

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
