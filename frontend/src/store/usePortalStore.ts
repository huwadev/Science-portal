import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface PortalState {
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const usePortalStore = create<PortalState>((set) => {
  // Safe client-side reading of localStorage
  const getInitialLang = (): 'en' | 'am' => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal_lang');
      return (saved === 'am' || saved === 'en') ? saved : 'en';
    }
    return 'en';
  };

  const getInitialToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('portal_token');
    }
    return null;
  };

  const getInitialUser = (): User | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal_user');
      try {
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  return {
    language: getInitialLang(),
    setLanguage: (lang) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('portal_lang', lang);
      }
      set({ language: lang });
    },
    user: getInitialUser(),
    token: getInitialToken(),
    setUser: (user) => {
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('portal_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('portal_user');
        }
      }
      set({ user });
    },
    setToken: (token) => {
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem('portal_token', token);
        } else {
          localStorage.removeItem('portal_token');
        }
      }
      set({ token });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('portal_user');
        localStorage.removeItem('portal_token');
      }
      set({ user: null, token: null });
    },
  };
});
