import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Component/Layout/Sidebar';
import Topnavbar from './Component/Layout/Topnavbar';
import Dashboard from './Pages/Dashboard';
import Employee from './Pages/Employee';
import Calendar from './Pages/Calendar';
import Attendence from './Pages/Attendence';
import Leave from './Pages/Leave';
import AdminPanel from './AdminPanel/AdminPanel';
import Payrolle from './Pages/Payrolle';
import Payroll_D from './Payroll_D/Payroll_D';
import SalaryComponents from './Payroll_D/SalaryComponent';
import MyPayslips from './Pages/MyPayslips';
import PayrollAdjustments from './Pages/PayrollAdjustments';
import LoginPage from './Pages/Login';
import LeaveBalances from './Pages/Leave-balances';
import LeaveTypesPage from './Pages/LeaveTypes';
import { useTheme } from './context/ThemeContext';

// Helper: Role ko normalize karne ke liye
const normalizeRole = (role) => {
  const normalized = (role || 'accountant').toString().toLowerCase();
  if (normalized === 'user' || normalized === 'employee') return 'accountant';
  if (normalized === 'payroll' || normalized === 'company') return 'salary clerk';
  return normalized;
};

// Helper: Auth Data nikalne ke liye
const getStoredAuth = () => {
  let user = {};
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }
  const token = localStorage.getItem('token');
  return {
    token: Boolean(token),
    role: normalizeRole(user.role),
    user,
  };
};

// Helper: Role ke hisaab se redirect path
const getDashboardPath = (role) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'salary clerk') return '/payroll';
  if (normalizedRole === 'admin') return '/admin';
  return '/dashboard';
};

// --- Home Route Logic ---
function HomeRoute() {
  const { role } = getStoredAuth();
  if (role === 'salary clerk') return <Payrolle />;
  if (role === 'admin') return <AdminPanel />;
  return <Dashboard />;
}

// --- Protected Route Logic ---
function ProtectedRoute({ children, requiredRole }) {
  const { token, role } = getStoredAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Agar requiredRole diya hai aur user ka role match nahi karta
  // Note: Admin ko humne niche Routes mein allow kiya hai workforce dekhne ke liye
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (requiredRole && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const { theme } = useTheme();
  const { token, role } = getStoredAuth();

  // FIX: Sidebar ab Login page ko chhod kar sabhi roles (Admin, Payroll, User) ko dikhega
  const isAuthPage = ['/login', '/signin'].includes(location.pathname);
  const shouldShowSidebar = !isAuthPage && token;

  return (
    <div 
      className={`d-flex min-vh-100 w-100 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`} 
      style={{ overflow: 'hidden' }}
    >
      {/* 1. Sidebar: Fixed width 280px handle karta hai */}
      {shouldShowSidebar && <Sidebar />}

      {/* 2. Main Content: flex-grow-1 bachi hui poori width le lega */}
      <main 
        className="app-main flex-grow-1 d-flex flex-column" 
        style={{ 
          height: '100vh', 
          overflow: 'hidden', 
          position: 'relative' 
        }}
      >
        {/* Top Navbar */}
        {shouldShowSidebar && <Topnavbar />}

        {/* Route Content Area */}
        <div 
          className={`flex-grow-1 ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`} 
          style={{ 
            overflowY: 'auto', 
            padding: '0' // Padding pages ke andar handle hogi ya niche Container mein
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<LoginPage />} />

            {/* General Protected Routes */}
            <Route path="/" element={<ProtectedRoute><HomeRoute /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><HomeRoute /></ProtectedRoute>} />

            {/* Workforce Routes: Inhe Admin aur User dono dekh sakte hain */}
            <Route path="/employees" element={<ProtectedRoute><Employee /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendence /></ProtectedRoute>} />
            <Route path="/attendence" element={<ProtectedRoute><Attendence /></ProtectedRoute>} />
            
            {/* Leave Management Routes */}
            <Route path="/leave" element={<ProtectedRoute><Leave /></ProtectedRoute>} />
            <Route path="/leave/balances" element={<ProtectedRoute><LeaveBalances /></ProtectedRoute>} />
            <Route path="/leave/types" element={<ProtectedRoute><LeaveTypesPage /></ProtectedRoute>} />

            {/* Role Specific Routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><Payrolle /></ProtectedRoute>} />
            <Route path="/payroll-deshboard" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><Payroll_D /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><Payroll_D /></ProtectedRoute>} />
            <Route path="/payroll/components" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><SalaryComponents /></ProtectedRoute>} />
            <Route path="/payroll/payslips" element={<ProtectedRoute><MyPayslips /></ProtectedRoute>} />
            <Route path="/payroll/allowances-deductions" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><SalaryComponents /></ProtectedRoute>} />
            <Route path="/payroll/loans-advances" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><PayrollAdjustments type="LoanAdvance" /></ProtectedRoute>} />
            <Route path="/payroll/arrear" element={<ProtectedRoute requiredRole={["salary clerk", "hr", "admin"]}><PayrollAdjustments type="Arrear" /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to={token ? getDashboardPath(role) : '/login'} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;