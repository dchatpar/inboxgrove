import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface TrialSession {
  trialId?: string;
  expiresAt?: string;
}

function getTrialSession(): { valid: boolean; expired: boolean; data: TrialSession | null } {
  const raw = localStorage.getItem('trialData');
  if (!raw) return { valid: false, expired: false, data: null };
  try {
    const parsed: TrialSession = JSON.parse(raw);
    if (!parsed.expiresAt) return { valid: false, expired: false, data: null };
    const expires = new Date(parsed.expiresAt).getTime();
    const now = Date.now();
    if (Number.isNaN(expires)) return { valid: false, expired: false, data: null };
    if (expires <= now) return { valid: false, expired: true, data: parsed };
    return { valid: true, expired: false, data: parsed };
  } catch {
    return { valid: false, expired: false, data: null };
  }
}

const ProtectedTrialRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  const session = getTrialSession();

  if (session.expired) {
    localStorage.removeItem('trialData');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return <Navigate to="/onboarding" replace state={{ reason: 'expired', from: location.pathname }} />;
  }

  if (!session.valid) {
    return <Navigate to="/onboarding" replace state={{ reason: 'missing', from: location.pathname }} />;
  }

  return children;
};

export default ProtectedTrialRoute;
