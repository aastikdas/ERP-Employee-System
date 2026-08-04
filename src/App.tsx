import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Payroll from './pages/Payroll';
import Profile from './pages/Profile';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Main App Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Default Page */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Sub Routes */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="departments" element={<Departments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leaves" element={<Leaves />} />
              
              {/* Role Restricted Route (Managers do not manage payroll directly) */}
              <Route 
                path="payroll" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'EMPLOYEE']}>
                    <Payroll />
                  </ProtectedRoute>
                } 
              />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
