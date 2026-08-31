import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, departmentService } from '../services/api';
import { IUser, IDepartment, UserRole } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Users,
  Search,
  Plus,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  KeyRound,
  Shield,
  Building2,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser, isAdminOrSecurity } = useAuth();

  const [users, setUsers] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    password: 'Password123!',
    role: 'STAFF' as UserRole,
    department: '',
    site: 'Hemas Hospital Wattala',
    position: 'Staff Nurse',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedRole) params.role = selectedRole;
      if (selectedDept) params.department = selectedDept;

      const res = await userService.getUsers(params);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, selectedDept]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getDepartments();
        if (res.data.success) setDepartments(res.data.departments);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepts();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await userService.createUser(formData);
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setSuccessMessage(`User ${res.data.user.fullName} (${res.data.user.employeeId}) created successfully.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setFormData({
          employeeId: '',
          fullName: '',
          email: '',
          password: 'Password123!',
          role: 'STAFF',
          department: '',
          site: 'Hemas Hospital Wattala',
          position: 'Staff Nurse',
        });
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlockUser = async (userId: string, name: string) => {
    try {
      await userService.unlockUser(userId);
      setSuccessMessage(`Account for ${name} unlocked successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock user');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'IT_SECURITY_ADMIN':
        return <Badge variant="purple" size="sm">IT Security</Badge>;
      case 'ADMIN':
        return <Badge variant="info" size="sm">Admin</Badge>;
      case 'DEPARTMENT_HEAD':
        return <Badge variant="teal" size="sm">Dept Head</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Staff</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hospital Personnel Directory
            </h1>
            <Badge variant="teal" size="sm">
              {users.length} Active Staff
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage hospital staff credentials, clinical roles, and account security lockouts.
          </p>
        </div>

        {isAdminOrSecurity && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Hospital Employee
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee ID, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Roles</option>
            <option value="STAFF">Staff</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
            <option value="ADMIN">Hospital Admin</option>
            <option value="IT_SECURITY_ADMIN">IT Security Admin</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching hospital directory..." />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Personnel Found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Hospital Site</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((user) => {
                  const isLocked = user.lockUntil && new Date(user.lockUntil).getTime() > Date.now();
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {user.employeeId} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-medium">
                          {typeof user.department === 'object' && user.department?.name
                            ? user.department.name
                            : 'All Facilities'}
                        </p>
                        <p className="text-[11px] text-slate-400">{user.position}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{user.site}</td>
                      <td className="px-6 py-4">
                        {isLocked ? (
                          <Badge variant="danger" size="sm" dot>
                            Locked (Failed Logins)
                          </Badge>
                        ) : user.isActive ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Deactivated
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLocked && isAdminOrSecurity && (
                          <button
                            onClick={() => handleUnlockUser(user._id, user.fullName)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Unlock Account
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Hospital Employee"
        subtitle="Register credentials and assign clinical department and role."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HEM-STF-010"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Security Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="STAFF">Hospital Staff</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="ADMIN">Hospital Admin</option>
                <option value="IT_SECURITY_ADMIN">IT Security Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Nimal Jayasuriya"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="nimal@securehemas.local"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Password *
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="">None / Corporate</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Position
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ICU Senior Nurse"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
