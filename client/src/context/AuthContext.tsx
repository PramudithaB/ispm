import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, UserRole } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isSecurityAdmin: boolean;
  isAdminOrSecurity: boolean;
  isDeptHead: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('securehemas_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('securehemas_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('securehemas_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('securehemas_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Failed to verify active session:', error);
          localStorage.removeItem('securehemas_token');
          localStorage.removeItem('securehemas_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (data: any) => {
    try {
      const res = await authService.register(data);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('securehemas_token', receivedToken);
        localStorage.setItem('securehemas_user', JSON.stringify(receivedUser));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please check your details.';
      return { success: false, message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login({ email, password });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('securehemas_token', receivedToken);
        localStorage.setItem('securehemas_user', JSON.stringify(receivedUser));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed.' };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 423
          ? 'Account is temporarily locked due to failed login attempts.'
          : 'Invalid login credentials.');
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('securehemas_token');
      localStorage.removeItem('securehemas_user');
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('securehemas_user', JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isSecurityAdmin = user?.role === 'IT_SECURITY_ADMIN';
  const isAdminOrSecurity = user?.role === 'ADMIN' || user?.role === 'IT_SECURITY_ADMIN';
  const isDeptHead = user?.role === 'DEPARTMENT_HEAD';
  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        register,
        login,
        logout,
        refreshUser,
        hasRole,
        isAdmin,
        isSecurityAdmin,
        isAdminOrSecurity,
        isDeptHead,
        isStaff,
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
