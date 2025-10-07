import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, User, supabase, healthCheck } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
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
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          setAccessToken(session.access_token);
          await loadUserProfile(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAccessToken(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // First check if the server is responding
      console.log('Checking server health...');
      const serverHealthy = await healthCheck();
      
      if (!serverHealthy) {
        console.warn('Server health check failed, but continuing with client-side auth');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setAccessToken(session.access_token);
        await loadUserProfile(session.access_token);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (token: string) => {
    try {
      const { user: userProfile } = await auth.getProfile(token);
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await auth.login(email, password);
      
      if (response.session) {
        setAccessToken(response.session.access_token);
        setUser(response.user);
        toast.success('Login successful!');
        return true;
      }
      
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
    fullName: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      await auth.register(email, password, fullName, 'player');
      toast.success('Registration successful! Please log in.');
      return true;
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
      await auth.logout();
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
      const { user: updatedUser } = await auth.updateProfile(accessToken, updates);
      setUser(updatedUser);
      toast.success('Profile updated successfully');
      return true;
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