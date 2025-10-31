import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner@2.0.3';

// DEV MODE: Set to true to bypass authentication (for development only)
// TODO: Remove or set to false when database is connected
const DEV_MODE = true;

export interface User {
  id: string;
  email: string;
  fullName: string;
  userType: 'player' | 'admin';
  preferences?: {
    notifications: boolean;
    timezone: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string, userType?: 'player' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize auth state - Supabase removed
      // TODO: Implement your authentication initialization logic here
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      // DEV MODE: Auto-login without database
      if (DEV_MODE) {
        const mockUser: User = {
          id: 'dev-user-123',
          email: email,
          fullName: 'Development User',
          userType: 'player',
          preferences: {
            notifications: true,
            timezone: 'America/New_York'
          }
        };
        setUser(mockUser);
        setAccessToken('dev-token-123');
        toast.success('Logged in (Dev Mode)');
        return true;
      }

      // TODO: Implement your login logic here
      toast.error('Login functionality requires authentication backend');
      return false;
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    userType?: 'player' | 'admin'
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // DEV MODE: Auto-register without database
      if (DEV_MODE) {
        const mockUser: User = {
          id: 'dev-user-' + Date.now(),
          email: email,
          fullName: fullName,
          userType: userType || 'player',
          preferences: {
            notifications: true,
            timezone: 'America/New_York'
          }
        };
        setUser(mockUser);
        setAccessToken('dev-token-' + Date.now());
        toast.success('Registered successfully (Dev Mode)');
        return true;
      }

      // TODO: Implement your registration logic here
      toast.error('Registration functionality requires authentication backend');
      return false;
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // TODO: Implement your logout logic here
      setUser(null);
      setAccessToken(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      // TODO: Implement your profile update logic here
      if (user) {
        setUser({ ...user, ...updates });
        toast.success('Profile updated successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.message || 'Profile update failed');
      return false;
    }
  };

  const getAccessToken = (): string | null => {
    return accessToken;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}