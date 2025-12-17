# Frontend Integration Guide - InboxGrove

## 📋 Table of Contents

1. Setup & Configuration
2. API Integration
3. State Management
4. Authentication Flow
5. Routing & Navigation
6. Mobile Responsiveness
7. Error Handling
8. Testing Strategy

---

## 1️⃣ Setup & Configuration

### Step 1: Environment Variables

Create `.env.local` in project root:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
VITE_APP_NAME=InboxGrove
VITE_ENABLE_ANALYTICS=true
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Update App.tsx

```typescript
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
```

---

## 2️⃣ API Integration

### Using API Client

The centralized API client handles all backend communication:

```typescript
import { apiClient } from './services/apiClient';

// Authentication
await apiClient.login(email, password);
await apiClient.register(email, password, companyName);
await apiClient.logout();

// Billing
await apiClient.getSubscription();
await apiClient.createSubscription(planId, 'monthly');
await apiClient.getInvoices();

// Domains
await apiClient.searchDomains('acme-corp');
await apiClient.purchaseDomain('acme-corp.com');
await apiClient.getDomains();

// Infrastructure
await apiClient.provisionInboxes(domainId, 50, 'firstname');
await apiClient.getInboxes();
```

### Error Handling

```typescript
const response = await apiClient.login(email, password);

if (response.status === 200 && response.data) {
  // Success
  console.log('Logged in:', response.data);
} else {
  // Error
  console.error('Login failed:', response.error);
}
```

### Request Retry Logic

API client automatically retries on:
- Network failures (exponential backoff)
- 429 (Rate limit)
- 502, 503 (Server errors)

Max retries: 3 (configurable)

---

## 3️⃣ State Management with Auth Context

### Setup AuthProvider

Wrap your app with `AuthProvider`:

```typescript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your routes here */}
    </AuthProvider>
  );
}
```

### Using useAuth Hook

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const {
    user,
    trial,
    subscription,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setupTrial,
    createSubscription
  } = useAuth();

  // Handle loading state
  if (isLoading) return <Spinner />;

  // Handle error
  if (error) return <Error message={error} />;

  // Handle unauthenticated
  if (!isAuthenticated) return <Redirect to="/auth/login" />;

  // Render authenticated content
  return (
    <div>
      <p>Welcome, {user?.email}</p>
      {trial?.is_active && <p>Trial expires in {trial.days_remaining} days</p>}
    </div>
  );
}
```

### Auth Context Properties

```typescript
interface AuthContextType {
  // State
  user: User | null;
  trial: TrialInfo | null;
  subscription: SubscriptionInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Methods
  register(email, password, companyName): Promise<boolean>;
  login(email, password): Promise<boolean>;
  logout(): Promise<void>;
  setupTrial(planId): Promise<boolean>;
  extendTrial(days): Promise<boolean>;
  createSubscription(planId, billingCycle): Promise<boolean>;
  upgradeSubscription(planId): Promise<boolean>;
  cancelSubscription(immediate): Promise<boolean>;
  reactivateSubscription(): Promise<boolean>;
  refreshUser(): Promise<void>;
  clearError(): void;
}
```

---

## 4️⃣ Authentication Flow

### Registration Flow

```
User fills signup form
    ↓
onClick: register(email, password, companyName)
    ↓
AuthContext calls apiClient.register()
    ↓
Backend creates account + trial
    ↓
Tokens stored in localStorage
    ↓
AuthContext auto-sets user + trial
    ↓
Redirect to /onboarding or /dashboard
```

**Implementation:**

```typescript
const handleRegister = async (formData: SignupForm) => {
  const success = await register(
    formData.email,
    formData.password,
    formData.companyName
  );

  if (success) {
    navigate('/onboarding');
  } else {
    showError('Registration failed');
  }
};
```

### Login Flow

```
User enters email + password
    ↓
onClick: login(email, password)
    ↓
AuthContext calls apiClient.login()
    ↓
Backend validates credentials
    ↓
Tokens returned and stored
    ↓
AuthContext fetches user + subscription
    ↓
Check trial status
    ↓
Redirect to appropriate page:
  - Trial active? → /dashboard
  - Trial expired? → /billing
  - Has subscription? → /dashboard
```

**Implementation:**

```typescript
const handleLogin = async (email: string, password: string) => {
  const success = await login(email, password);

  if (success) {
    if (trial?.is_active) {
      navigate('/dashboard');
    } else if (subscription) {
      navigate('/dashboard');
    } else {
      navigate('/billing');
    }
  }
};
```

### Token Refresh

Automatically handled by API client:

```typescript
// Any 401 response automatically:
1. Calls /auth/refresh with refresh_token
2. Gets new access_token
3. Retries original request
4. If refresh fails: clears tokens + redirects to /auth/login
```

---

## 5️⃣ Routing & Navigation

### Recommended Router Structure

```
/                           → Landing page
/auth/login                 → Login page
/auth/register              → Registration page
/auth/forgot-password       → Password reset

/onboarding                 → Trial onboarding wizard
/onboarding/trial           → Plan selection
/onboarding/payment         → Payment form
/onboarding/confirmation    → Confirmation

/dashboard                  → Main dashboard
/dashboard/domains          → Domain management
/dashboard/inboxes          → Inbox management
/dashboard/analytics        → Analytics
/dashboard/warmup           → Warmup campaigns

/billing                    → Billing dashboard
/billing/invoices           → Invoice history
/billing/settings           → Billing settings
/billing/upgrade            → Plan upgrade

/account                    → Account settings
/account/profile            → Profile page
/account/security           → Security settings
```

### Protected Route Component

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAuth?: boolean;
  requiredSubscription?: boolean;
  requiredActiveTrial?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAuth = true,
  requiredSubscription = false,
  requiredActiveTrial = false,
}) => {
  const { isAuthenticated, subscription, trial, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (requiredAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  if (requiredSubscription && !subscription?.id) {
    return <Navigate to="/billing" />;
  }

  if (requiredActiveTrial && !trial?.is_active) {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};
```

### Router Setup with React Router

```typescript
// routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AppSkeleton />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
```

---

## 6️⃣ Mobile Responsiveness

### Tailwind Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Approach

```typescript
// ✅ CORRECT: Start with mobile, add complexity
<div className="p-2 sm:p-4 md:p-6">
  Mobile (16px) → Tablet (32px) → Desktop (64px)
</div>

// ❌ WRONG: Desktop-first
<div className="p-6 md:p-4 sm:p-2">
  Confusing and reverse-engineered
</div>
```

### Responsive Grid Example

```typescript
// Auto-adjusts: 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### Touch-Friendly UI (Mobile)

```typescript
// Large touch targets (48px minimum)
<button className="px-4 py-3 md:px-6 md:py-2.5">
  Click me
</button>

// Readable text on small screens
<p className="text-base md:text-lg lg:text-xl">
  This text adjusts for all screen sizes
</p>

// Horizontal scrolling for tables
<div className="overflow-x-auto md:overflow-x-visible">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

### Mobile Navigation Pattern

```typescript
const [isMenuOpen, setIsMenuOpen] = useState(false);

return (
  <nav>
    {/* Mobile menu button - only visible on small screens */}
    <button
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className="md:hidden"
    >
      <Menu size={24} />
    </button>

    {/* Desktop menu - hidden on mobile */}
    <div className="hidden md:flex gap-4">
      {navItems.map(item => <NavLink key={item.id} {...item} />)}
    </div>

    {/* Mobile menu - visible when open */}
    {isMenuOpen && (
      <div className="md:hidden absolute top-16 left-0 right-0 bg-black p-4">
        {navItems.map(item => <MobileNavLink key={item.id} {...item} />)}
      </div>
    )}
  </nav>
);
```

---

## 7️⃣ Error Handling

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
try {
  const response = await apiClient.login(email, password);

  if (!response.data) {
    switch (response.status) {
      case 401:
        showError('Invalid email or password');
        break;
      case 429:
        showError('Too many login attempts. Please try again later.');
        break;
      case 500:
        showError('Server error. Please try again later.');
        break;
      default:
        showError(response.error || 'Login failed');
    }
    return;
  }

  // Success
  navigate('/dashboard');
} catch (error) {
  showError('An unexpected error occurred');
}
```

### Toast Notifications

```typescript
// Use a toast library like react-toastify or sonner
import { toast } from 'sonner';

// Success
toast.success('Account created!');

// Error
toast.error('Registration failed');

// Loading
const { dismiss } = toast.loading('Processing...');
dismiss();

// Info
toast.info('Trial expires in 3 days');
```

---

## 8️⃣ Testing Strategy

### Unit Tests (Components)

```typescript
// __tests__/components/AuthPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from '@/components/AuthPage';

describe('AuthPage', () => {
  it('should render login form', () => {
    render(<AuthPage />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('should handle login submission', async () => {
    render(<AuthPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/auth-flow.test.tsx
describe('Authentication Flow', () => {
  it('should complete signup → trial → dashboard flow', async () => {
    // 1. Register
    // 2. Verify trial setup
    // 3. Navigate to dashboard
    // 4. Assert dashboard loaded
  });

  it('should handle trial expiration and redirect to billing', async () => {
    // 1. Login with expired trial user
    // 2. Assert redirect to /billing
  });
});
```

### API Mock Strategy

```typescript
// __mocks__/apiClient.ts
export const mockApiClient = {
  login: jest.fn(),
  register: jest.fn(),
  getSubscription: jest.fn(),
  // ... etc
};
```

---

## 📊 Component Integration Checklist

- [ ] AuthContext provider set in App.tsx
- [ ] .env.local configured with API_BASE_URL
- [ ] All API endpoints documented and tested
- [ ] ProtectedRoute component implemented
- [ ] Mobile navigation patterns added
- [ ] Error boundaries in place
- [ ] Loading states for all async operations
- [ ] Toast notifications for user feedback
- [ ] Auth token refresh logic working
- [ ] All forms validated before submission
- [ ] Mobile responsive CSS reviewed
- [ ] Dark theme applied throughout
- [ ] Accessibility attributes (aria-*, role=) added
- [ ] Performance optimized (lazy loading, code splitting)

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📚 File Structure Reference

```
src/
├── components/           # React components
│   ├── DashboardEnhanced.tsx
│   ├── AuthPage.tsx
│   ├── TrialOnboarding.tsx
│   └── ...
├── contexts/            # State management
│   └── AuthContext.tsx
├── services/            # API & utilities
│   ├── apiClient.ts
│   └── ...
├── routes/              # Route definitions
│   └── AppRouter.tsx
├── types.ts             # TypeScript interfaces
├── App.tsx              # Root component
└── index.tsx            # Entry point
```

---

**Last Updated:** December 16, 2025

**Status:** READY FOR IMPLEMENTATION
