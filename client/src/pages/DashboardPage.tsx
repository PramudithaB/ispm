import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StaffDashboard } from '../components/dashboard/StaffDashboard';
import { DepartmentHeadDashboard } from '../components/dashboard/DepartmentHeadDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { SecurityAdminDashboard } from '../components/dashboard/SecurityAdminDashboard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Initializing your role security workspace..." />;
  }

  switch (user?.role) {
    case 'STAFF':
      return <StaffDashboard />;
    case 'DEPARTMENT_HEAD':
      return <DepartmentHeadDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'IT_SECURITY_ADMIN':
      return <SecurityAdminDashboard />;
    default:
      return <StaffDashboard />;
  }
};

export default DashboardPage;
