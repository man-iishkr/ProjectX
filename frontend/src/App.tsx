import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './auth/Login';
import EmployeeLogin from './auth/EmployeeLogin';
import AdminLayout from './layouts/AdminLayout';
import ManagerLayout from './layouts/ManagerLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import EmployeeList from './modules/employee/EmployeeList';
import HQList from './modules/hq/HQList';
import DoctorList from './modules/doctor/DoctorList';
import Dashboard from './modules/dashboard/Dashboard';
import ChemistList from './modules/chemist/ChemistList';
import TargetList from './modules/target/TargetList';
import ExpenseList from './modules/expense/ExpenseList';
import Analytics from './modules/analytics/Analytics';
import LeaveCalendar from './modules/leave/LeaveCalendar';
import RoutingList from './modules/routing/RoutingList';
import StockistList from './modules/stockist/StockistList';
import ProductList from './modules/inventory/ProductList';
import InventoryList from './modules/inventory/InventoryList';
import SalaryList from './modules/salary/SalaryList';
import DataImport from './modules/admin-tools/DataImport';
import CallReportList from './modules/callReport/CallReportList';
import EmployeeProfile from './modules/employee/EmployeeProfile';
import MyExpenses from './modules/expense/MyExpenses';
import AddDoctor from './modules/doctor/AddDoctor';

// Management roles (non-employee, non-admin)
const MANAGER_ROLES = ['sm', 'rsm', 'asm'];
const ADMIN_ROLES = ['admin'];
const EMPLOYEE_ROLES = ['bde'];



// Protect Routes Component
const ProtectedRoute = ({ children, allowedRoles }: { children: any, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;

  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Role-based redirect
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
  if (MANAGER_ROLES.includes(user.role)) return <Navigate to="/manager/dashboard" />;
  if (user.role === 'bde') return <Navigate to="/employee/dashboard" />;

  return <div>Unknown role</div>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<EmployeeLogin />} />
      <Route path="/admin-login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* ADMIN ROUTES (Super Admin only) */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={ADMIN_ROLES}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="chemists" element={<ChemistList />} />
        <Route path="targets" element={<TargetList />} />
        <Route path="hqs" element={<HQList />} />
        <Route path="routing" element={<RoutingList />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="stockists" element={<StockistList />} />
        <Route path="leave" element={<LeaveCalendar />} />
        <Route path="inventory/products" element={<ProductList />} />
        <Route path="inventory/stock" element={<InventoryList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="calls" element={<CallReportList />} />
        <Route path="import" element={<DataImport />} />
        <Route path="salary" element={<SalaryList />} />
      </Route>

      {/* MANAGER ROUTES (SM, RSM, ASM) */}
      <Route path="/manager" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <ManagerLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="chemists" element={<ChemistList />} />
        <Route path="stockists" element={<StockistList />} />
        <Route path="routing" element={<RoutingList />} />
        <Route path="targets" element={<TargetList />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="expenses" element={<ExpenseList />} />
        <Route path="calls" element={<CallReportList />} />
        <Route path="leave" element={<LeaveCalendar />} />
        <Route path="salary" element={<SalaryList />} />
        <Route path="import" element={<DataImport />} />
      </Route>

      {/* EMPLOYEE ROUTES (BDE) */}
      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={EMPLOYEE_ROLES}>
          <EmployeeLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="target" element={<TargetList />} />
        <Route path="calls" element={<CallReportList />} />
        <Route path="add-doctor" element={<AddDoctor />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="expenses" element={<MyExpenses />} />
        <Route path="leave" element={<LeaveCalendar />} />
        <Route path="import" element={<DataImport />} />
        <Route path="*" element={<Dashboard />} /> {/* Fallback */}
      </Route>

    </Routes>
  );
};

export default App;
