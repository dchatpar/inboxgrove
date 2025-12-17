import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import TrialStart from './components/TrialStart';
import TrialDashboard from './components/TrialDashboard';
import AdminDashboard from './components/AdminDashboardNew';

const RouterApp: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/onboarding" element={<TrialStart />} />
        <Route path="/dashboard" element={<TrialDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterApp;
