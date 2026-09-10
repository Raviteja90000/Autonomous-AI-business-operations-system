import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  autonomyTier: number;
  setAutonomyTier: (tier: number) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [autonomyTier, setAutonomyTier] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMe() {
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
        } catch (e) {
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadMe();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setToken(res.access_token);
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('ADMIN')) return true;
    return user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        autonomyTier,
        setAutonomyTier,
        login,
        logout,
        loading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
