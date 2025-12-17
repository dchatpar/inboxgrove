import React, { createContext, useContext, useMemo, useState } from 'react';
import { AppContextState, ApiKey, CreditTransaction, AuditLog, Organization, SystemMetrics, User } from '../types';
import { getMockData, addAuditLogEntry } from '../services/mockDataService';

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const seed = useMemo(() => getMockData(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(seed.users[0] || null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(
    seed.organizations.find((o) => o.id === seed.users[0]?.orgId) || seed.organizations[0] || null
  );
  const [users, setUsers] = useState<User[]>(seed.users);
  const [organizations, setOrganizations] = useState<Organization[]>(seed.organizations);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(seed.apiKeys);
  const [creditLedger, setCreditLedger] = useState<CreditTransaction[]>(seed.creditTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seed.auditLogs);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(seed.systemMetrics);
  const [impersonationMode, setImpersonationMode] = useState(false);

  const addApiKey = (key: ApiKey) => setApiKeys((prev) => [...prev, key]);
  const revokeApiKey = (id: string) => setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)));

  const addCreditTransaction = (txn: CreditTransaction) => setCreditLedger((prev) => [txn, ...prev]);

  const addAuditLog = (log: AuditLog) => {
    setAuditLogs((prev) => [log, ...prev]);
    addAuditLogEntry(log);
  };

  const value: AppContextState = {
    currentUser,
    currentOrg,
    users,
    organizations,
    apiKeys,
    creditLedger,
    auditLogs,
    systemMetrics,
    impersonationMode,
    setCurrentUser,
    setCurrentOrg,
    setUsers,
    setOrganizations,
    setApiKeys,
    addApiKey,
    revokeApiKey,
    addCreditTransaction,
    addAuditLog,
    setSystemMetrics,
    setImpersonationMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export default AppContext;
