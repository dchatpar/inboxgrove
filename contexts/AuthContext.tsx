import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export interface TrialInfo {
  is_active: boolean;
  started_at: string;
  expires_at: string;
  days_remaining: number;
  plan_id: string;
  inbox_limit: number;
  domain_limit: number;
}

export interface SubscriptionInfo {
  plan_id: string;
  plan_name: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  cancel_at_period_end: boolean;
}

export interface AuthContextType {
  user: User | null;
  trial: TrialInfo | null;
  subscription: SubscriptionInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  register: (email: string, password: string, companyName: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Trial methods
  setupTrial: (planId: string) => Promise<boolean>;
  extendTrial: (days: number) => Promise<boolean>;
  
  // Subscription methods
  createSubscription: (planId: string, billingCycle: 'monthly' | 'yearly') => Promise<boolean>;
  upgradeSubscription: (planId: string) => Promise<boolean>;
  cancelSubscription: (immediate?: boolean) => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;
  
  // Utility methods
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        if (!apiClient.isAuthenticated()) {
          setIsLoading(false);
          return;
        }

        // Fetch current user
        const userResponse = await apiClient.getCurrentUser();
        if (userResponse.data) {
          setUser(userResponse.data as User);
        }

        // Fetch trial info
        const trialResponse = await apiClient.getTrial();
        if (trialResponse.data) {
          setTrial(trialResponse.data as TrialInfo);
        }

        // Fetch subscription info
        const subResponse = await apiClient.getSubscription();
        if (subResponse.data) {
          setSubscription(subResponse.data as SubscriptionInfo);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
        apiClient.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const register = async (email: string, password: string, companyName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(email, password, companyName);

      if (!response.data) {
        throw new Error(response.error || 'Registration failed');
      }

      // Setup trial after registration
      const trialPlanId = 'trial'; // Default to trial
      await setupTrial(trialPlanId);

      // Reload user data
      await refreshUser();

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(email, password);

      if (!response.data) {
        throw new Error(response.error || 'Login failed');
      }

      // Reload user data
      await refreshUser();

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiClient.logout();
      setUser(null);
      setTrial(null);
      setSubscription(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setupTrial = async (planId: string): Promise<boolean> => {
    try {
      const response = await apiClient.setupTrial(planId);

      if (!response.data) {
        throw new Error(response.error || 'Trial setup failed');
      }

      setTrial(response.data as TrialInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Trial setup failed';
      setError(errorMsg);
      return false;
    }
  };

  const extendTrial = async (days: number): Promise<boolean> => {
    try {
      const response = await apiClient.extendTrial(days);

      if (!response.data) {
        throw new Error(response.error || 'Trial extension failed');
      }

      setTrial(response.data as TrialInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Trial extension failed';
      setError(errorMsg);
      return false;
    }
  };

  const createSubscription = async (
    planId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.createSubscription(planId, billingCycle);

      if (!response.data) {
        throw new Error(response.error || 'Subscription creation failed');
      }

      setSubscription(response.data as SubscriptionInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Subscription creation failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSubscription = async (planId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiClient.upgradeSubscription(planId);

      if (!response.data) {
        throw new Error(response.error || 'Upgrade failed');
      }

      setSubscription(response.data as SubscriptionInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upgrade failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (immediate: boolean = false): Promise<boolean> => {
    try {
      const response = await apiClient.cancelSubscription(immediate);

      if (!response.data) {
        throw new Error(response.error || 'Cancellation failed');
      }

      setSubscription(response.data as SubscriptionInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Cancellation failed';
      setError(errorMsg);
      return false;
    }
  };

  const reactivateSubscription = async (): Promise<boolean> => {
    try {
      const response = await apiClient.reactivateSubscription();

      if (!response.data) {
        throw new Error(response.error || 'Reactivation failed');
      }

      setSubscription(response.data as SubscriptionInfo);
      setError(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Reactivation failed';
      setError(errorMsg);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (!apiClient.isAuthenticated()) {
        setUser(null);
        return;
      }

      // Fetch current user
      const userResponse = await apiClient.getCurrentUser();
      if (userResponse.data) {
        setUser(userResponse.data as User);
      }

      // Fetch trial info
      const trialResponse = await apiClient.getTrial();
      if (trialResponse.data) {
        setTrial(trialResponse.data as TrialInfo);
      }

      // Fetch subscription info
      const subResponse = await apiClient.getSubscription();
      if (subResponse.data) {
        setSubscription(subResponse.data as SubscriptionInfo);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const isAuthenticated = apiClient.isAuthenticated() && user !== null;

  const value: AuthContextType = {
    user,
    trial,
    subscription,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    setupTrial,
    extendTrial,
    createSubscription,
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
