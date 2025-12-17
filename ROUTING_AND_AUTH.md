"""
InboxGrove Application Routes & Authentication Context
Complete routing structure and auth state management
"""

# ============================================================================
# ROUTING STRUCTURE
# ============================================================================

PUBLIC_ROUTES = [
    "/",                      # Landing page
    "/auth/login",             # Login page
    "/auth/register",          # Registration page
    "/auth/forgot-password",   # Password reset
    "/pricing",                # Pricing page
    "/features",               # Features page
    "/terms",                  # Terms of service
    "/privacy",                # Privacy policy
]

AUTHENTICATED_ROUTES = [
    "/onboarding",             # Trial onboarding with payment
    "/dashboard",              # Main dashboard
    "/dashboard/domains",      # Domain management
    "/dashboard/inboxes",      # Inbox management
    "/dashboard/warmup",       # Warmup campaigns
    "/dashboard/analytics",    # Analytics and reporting
    "/account",                # Account settings
    "/account/profile",        # Profile editing
    "/account/security",       # Security settings (2FA, etc)
    "/account/api-keys",       # API key management
    "/billing",                # Billing dashboard
    "/billing/subscription",   # Subscription management
    "/billing/invoices",       # Invoice history
    "/billing/payment-methods", # Payment methods
]

TRIAL_ONLY_ROUTES = [
    "/onboarding",             # Only during trial
    "/onboarding/payment",     # Payment setup
]

ADMIN_ROUTES = [
    "/admin/users",
    "/admin/subscriptions",
    "/admin/transactions",
    "/admin/promotions",
    "/admin/support",
]

# ============================================================================
# AUTH STATE MACHINE
# ============================================================================

class AuthState:
    """Authentication state flow"""
    
    UNAUTHENTICATED = "unauthenticated"        # No user logged in
    AUTHENTICATING = "authenticating"          # Login/register in progress
    AUTHENTICATED = "authenticated"            # Logged in, no trial
    TRIAL_ACTIVE = "trial_active"             # Logged in, trial active
    TRIAL_EXPIRED = "trial_expired"           # Trial ended, needs plan
    SUBSCRIPTION_ACTIVE = "subscription_active" # Active subscription
    SUBSCRIPTION_PAUSED = "subscription_paused" # Paused subscription
    SUBSCRIPTION_CANCELLED = "subscription_cancelled" # Cancelled subscription
    SUBSCRIPTION_PAST_DUE = "subscription_past_due"   # Payment failed


class AuthFlow:
    """Complete authentication flow"""
    
    # NEW USER FLOW:
    # 1. UNAUTHENTICATED
    # 2. User fills registration form
    # 3. AUTHENTICATING (POST /auth/register)
    # 4. AUTHENTICATED (Account created, trial auto-generated)
    # 5. Redirect to /onboarding
    # 6. User enters payment details (optional during trial)
    # 7. TRIAL_ACTIVE
    # 8. User has 7 days to use app
    # 9. TRIAL_EXPIRED (on day 8)
    # 10. Redirect to /onboarding/payment (if not set)
    # 11. SUBSCRIPTION_ACTIVE (after payment)
    
    # EXISTING USER FLOW (LOGIN):
    # 1. UNAUTHENTICATED
    # 2. User fills login form
    # 3. AUTHENTICATING (POST /auth/login)
    # 4. Check subscription status:
    #    a) TRIAL_ACTIVE -> dashboard
    #    b) SUBSCRIPTION_ACTIVE -> dashboard
    #    c) TRIAL_EXPIRED -> /onboarding/payment
    #    d) SUBSCRIPTION_PAST_DUE -> /billing/subscription


# ============================================================================
# ROUTE GUARDS & MIDDLEWARE
# ============================================================================

class RouteGuards:
    """Route protection logic"""
    
    @staticmethod
    def requireAuth(authState: str) -> bool:
        """Check if user is authenticated"""
        return authState in [
            "authenticated",
            "trial_active",
            "trial_expired",
            "subscription_active",
            "subscription_paused",
            "subscription_cancelled",
            "subscription_past_due"
        ]
    
    @staticmethod
    def requireTrial(authState: str) -> bool:
        """Check if user is in trial"""
        return authState == "trial_active"
    
    @staticmethod
    def requireSubscription(authState: str) -> bool:
        """Check if user has active subscription"""
        return authState in ["subscription_active", "subscription_paused"]
    
    @staticmethod
    def requirePaymentMethod(hasPayment: bool) -> bool:
        """Check if user has payment method on file"""
        return hasPayment
    
    @staticmethod
    def requireAdmin(role: str) -> bool:
        """Check if user is admin"""
        return role == "admin"


# ============================================================================
# FRONTEND ROUTING CONFIGURATION (React Router)
# ============================================================================

ROUTE_CONFIG = """
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './components/AuthPage';
import TrialOnboarding from './components/TrialOnboarding';
import Dashboard from './pages/Dashboard';
import DomainManagement from './pages/DomainManagement';
import InboxManagement from './pages/InboxManagement';
import Analytics from './pages/Analytics';
import BillingDashboard from './components/BillingDashboard';
import AccountSettings from './pages/AccountSettings';
import NotFound from './pages/NotFound';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
  requiredSubscription?: boolean;
  requiredTrial?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAuth = true,
  requiredSubscription = false,
  requiredTrial = false
}) => {
  const { user, trial, subscription, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  // Check authentication
  if (requiredAuth && !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check trial requirement
  if (requiredTrial && !trial?.isActive) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check subscription requirement
  if (requiredSubscription && !subscription?.isActive) {
    return <Navigate to="/billing/subscription" replace />;
  }

  // Check if trial expired and needs payment
  if (user && trial?.isExpired && !subscription?.isActive) {
    return <Navigate to="/onboarding/payment" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Auth routes */}
        <Route path="/auth/login" element={<AuthPage mode="login" />} />
        <Route path="/auth/register" element={<AuthPage mode="register" />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password/:token" element={<ResetPassword />} />

        {/* Trial onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requiredAuth={true}>
              <TrialOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/payment"
          element={
            <ProtectedRoute requiredAuth={true}>
              <TrialOnboarding />
            </ProtectedRoute>
          }
        />

        {/* Authenticated routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredAuth={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/domains"
          element={
            <ProtectedRoute requiredAuth={true}>
              <DomainManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/inboxes"
          element={
            <ProtectedRoute requiredAuth={true}>
              <InboxManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/warmup"
          element={
            <ProtectedRoute requiredAuth={true}>
              <WarmupCampaigns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute requiredAuth={true}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Account routes */}
        <Route
          path="/account"
          element={
            <ProtectedRoute requiredAuth={true}>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute requiredAuth={true}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/security"
          element={
            <ProtectedRoute requiredAuth={true}>
              <SecuritySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/api-keys"
          element={
            <ProtectedRoute requiredAuth={true}>
              <APIKeyManagement />
            </ProtectedRoute>
          }
        />

        {/* Billing routes */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute requiredAuth={true}>
              <BillingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/subscription"
          element={
            <ProtectedRoute requiredAuth={true}>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/invoices"
          element={
            <ProtectedRoute requiredAuth={true}>
              <InvoiceHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/payment-methods"
          element={
            <ProtectedRoute requiredAuth={true}>
              <PaymentMethodManagement />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
"""

# ============================================================================
# AUTHENTICATION CONTEXT CONFIGURATION
# ============================================================================

AUTH_CONTEXT_CONFIG = """
// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface Trial {
  id: string;
  isActive: boolean;
  isExpired: boolean;
  startedAt: string;
  expiresAt: string;
  daysRemaining: number;
  tier: string;
}

interface Subscription {
  id: string;
  isActive: boolean;
  plan: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  trial: Trial | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Trial/Subscription
  startTrial: (plan: string) => Promise<void>;
  upgradePlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.inboxgrove.com/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setTrial(data.trial);
        setSubscription(data.subscription);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Implementation
  };

  const register = async (email: string, password: string, name: string) => {
    // Implementation
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setTrial(null);
    setSubscription(null);
  };

  const value: AuthContextType = {
    user,
    trial,
    subscription,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile: async () => {},
    startTrial: async () => {},
    upgradePlan: async () => {},
    cancelSubscription: async () => {}
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
"""
