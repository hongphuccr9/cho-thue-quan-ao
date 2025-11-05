import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

const ADMIN_PASSWORD = "Tam@0707";
const USER_PASSWORD = "1234567";
const AUTH_STATE_KEY = 'clothingRentalAuth';

export type User = {
  role: 'admin' | 'user';
};

interface AuthContextType {
  user: User | null;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get initial state from localStorage
const getInitialAuthState = (): User | null => {
    try {
        const storedState = localStorage.getItem(AUTH_STATE_KEY);
        if (storedState) {
            return JSON.parse(storedState);
        }
    } catch (error) {
        console.error("Could not parse auth state from localStorage", error);
        localStorage.removeItem(AUTH_STATE_KEY);
    }
    return null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialAuthState);

  const login = useCallback((password: string): boolean => {
    let authenticatedUser: User | null = null;
    if (password === ADMIN_PASSWORD) {
      authenticatedUser = { role: 'admin' };
    } else if (password === USER_PASSWORD) {
      authenticatedUser = { role: 'user' };
    }

    if (authenticatedUser) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STATE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};