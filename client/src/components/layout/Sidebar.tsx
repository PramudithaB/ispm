import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  FileSpreadsheet,
  Activity,
  Bell,
  User,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const role = user?.role;

  // Build navigation items dynamically based on role
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/policies',
      label: 'Policies',
      icon: <FileText className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/training',
      label: 'Training & Quizzes',
      icon: <GraduationCap className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/compliance',
      label:
        role === 'STAFF'
          ? 'My Compliance'
          : role === 'DEPARTMENT_HEAD'
          ? 'Dept Compliance'
          : 'Compliance Matrix',
      icon: <CheckCircle className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/incidents',
      label: role === 'STAFF' ? 'Report Incident' : 'Incidents',
      icon: <AlertTriangle className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/users',
      label: 'Staff Directory',
      icon: <Users className="w-5 h-5" />,
      show: role === 'ADMIN' || role === 'IT_SECURITY_ADMIN' || role === 'DEPARTMENT_HEAD',
    },
    {
      to: '/departments',
      label: 'Departments',
      icon: <Building2 className="w-5 h-5" />,
      show: role === 'ADMIN' || role === 'IT_SECURITY_ADMIN',
    },
    {
      to: '/reports',
      label: 'Compliance Reports',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      show: role === 'ADMIN' || role === 'IT_SECURITY_ADMIN' || role === 'DEPARTMENT_HEAD',
    },
    {
      to: '/audit-logs',
      label: 'Audit Trail',
      icon: <Activity className="w-5 h-5" />,
      show: role === 'ADMIN' || role === 'IT_SECURITY_ADMIN',
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      show: true,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      show: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.show);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Role Status Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-hemas-navy text-white shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300">
                Security Clearance
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">
              {user?.fullName}
            </p>
            <p className="text-[11px] text-slate-300 truncate">
              {user?.position}
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation Menu
            </p>
            <nav className="space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 border border-brand-200/60 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          isActive ? 'text-brand-600' : 'text-slate-400'
                        }
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>SecureHemas v1.0</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Protected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
