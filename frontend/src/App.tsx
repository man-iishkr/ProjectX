import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './auth/Login';
import AdminLayout from './layouts/AdminLayout';
import HQLayout from './layouts/HQLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeList from './modules/employee/EmployeeList';
import HQList from './modules/hq/HQList';
import DoctorList from './modules/doctor/DoctorList';
import Dashboard from './modules/dashboard/Dashboard';
import ChemistList from './modules/chemist/ChemistList';
import Placeholder from './components/Placeholder';
import Analytics from './modules/analytics/Analytics';
import LeaveCalendar from './modules/leave/LeaveCalendar';

// Protect Routes Component
const ProtectedRoute = ({ children, allowedRoles }: { children: any, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />; // or login

  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Role based redirect
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  if (user.role === 'hq') return <Navigate to="/hq/dashboard" />;
  if (user.role === 'employee') return <Navigate to="/employee/dashboard" />;

  return <div>Unknown role</div>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ADMIN ROUTES */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="chemists" element={<ChemistList />} />
        <Route path="hqs" element={<HQList />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="leave" element={<LeaveCalendar />} />
        <Route path="salary" element={<Placeholder title="Salary Management" />} />
        <Route path="*" element={<Placeholder title="Admin Page" />} />
      </Route>

      {/* HQ ROUTES */}
      <Route path="/hq" element={
        <ProtectedRoute allowedRoles={['hq']}>
          <HQLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="*" element={<Placeholder title="HQ Page" />} />
      </Route>

      {/* EMPLOYEE ROUTES */}
      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="*" element={<Placeholder title="Employee Page" />} />
      </Route>

    </Routes>
  );
};

export default App;
