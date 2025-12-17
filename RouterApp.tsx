import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import TrialStart from './components/TrialStart';
import TrialDashboard from './components/TrialDashboard';
import TrialOnboarding from './components/TrialOnboarding';
import AdminDashboard from './components/AdminDashboardNew';
import DomainSetup from './components/DomainSetup';
import DomainPurchase from './components/DomainPurchase';
import MailboxGenerator from './components/MailboxGenerator';
import Provisioning from './components/Provisioning';
import ProtectedTrialRoute from './components/ProtectedTrialRoute';

const RouterApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Site */}
        <Route path="/" element={<App />} />
        
        {/* Trial & Onboarding */}
        <Route path="/onboarding" element={<TrialStart />} />
        <Route path="/trial/setup" element={<TrialOnboarding />} />
        <Route
          path="/trial/dashboard"
          element={
            <ProtectedTrialRoute>
              <TrialDashboard />
            </ProtectedTrialRoute>
          }
        />
        
        {/* Domain Management */}
        <Route
          path="/domains"
          element={
            <ProtectedTrialRoute>
              <DomainSetup />
            </ProtectedTrialRoute>
          }
        />
        <Route
          path="/domains/purchase"
          element={
            <ProtectedTrialRoute>
              <DomainPurchase />
            </ProtectedTrialRoute>
          }
        />
        
        {/* Mailbox Operations */}
        <Route
          path="/mailboxes"
          element={
            <ProtectedTrialRoute>
              <MailboxGenerator />
            </ProtectedTrialRoute>
          }
        />
        <Route
          path="/provisioning"
          element={
            <ProtectedTrialRoute>
              <Provisioning />
            </ProtectedTrialRoute>
          }
        />
        
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedTrialRoute>
              <TrialDashboard />
            </ProtectedTrialRoute>
          }
        />
        
        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Catch-all - redirect to home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterApp;
