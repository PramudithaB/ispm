import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { IUser } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Building2,
  MapPin,
  IdCard,
  Briefcase,
  Search,
  Filter,
  Check,
  X,
  Send,
  Shield,
  Users,
} from 'lucide-react';

export const StaffRegistrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<IUser | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getPendingRegistrations();
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      console.error('Failed to load pending registrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (staff: IUser) => {
    if (!confirm(`Are you sure you want to approve the staff account for ${staff.fullName} (${staff.employeeId})?`)) {
      return;
    }

    setActionLoadingId(staff._id);
    setNotification(null);

    try {
      const res = await userService.approveRegistration(staff._id);
      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Account for ${staff.fullName} (${staff.email}) has been approved and activated. An approval confirmation email has been sent.`,
        });
        await fetchRegistrations();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to approve staff registration.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalUser) return;

    setActionLoadingId(rejectModalUser._id);
    setNotification(null);

    try {
      const res = await userService.rejectRegistration(rejectModalUser._id, {
        reason: rejectReason.trim() || 'Registration credentials could not be verified with Hospital HR records.',
      });

      if (res.data.success) {
        setNotification({
          type: 'success',
          message: `Staff registration for ${rejectModalUser.fullName} has been rejected. Notice email dispatched.`,
        });
        setRejectModalUser(null);
        setRejectReason('');
        await fetchRegistrations();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reject registration.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.position.toLowerCase().includes(q)
    );
  });

  const verifiedCount = registrations.filter((r) => r.emailVerified).length;
  const unverifiedCount = registrations.filter((r) => !r.emailVerified).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Staff Registration Review
            </h1>
            <Badge variant="purple" size="sm">
              {registrations.length} Pending
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review self-registered hospital staff, verify clinical credentials, and approve or reject access.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Pending Review</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{registrations.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Email Verified</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{verifiedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Awaiting Email Verification</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{unverifiedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <button
          onClick={fetchRegistrations}
          className="text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors self-end sm:self-auto"
        >
          ↻ Refresh Queue
        </button>
      </div>

      {/* Registrations List / Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading pending registrations..." />
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Pending Staff Registrations</h3>
          <p className="text-xs text-slate-400 mt-1">
            All self-registered employee accounts have been reviewed and approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((staff) => (
            <div
              key={staff._id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Staff Details */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {staff.fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
                    {staff.employeeId}
                  </span>
                  {staff.emailVerified ? (
                    <Badge variant="success" size="sm" dot>
                      Email Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Email Pending
                    </Badge>
                  )}
                  <Badge variant="purple" size="sm">
                    STAFF
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.position}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {(staff.department as any)?.name || 'General Clinical'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.site}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Registered:{' '}
                  {staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalUser(staff);
                    setRejectReason('');
                  }}
                  disabled={actionLoadingId === staff._id}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(staff)}
                  disabled={actionLoadingId === staff._id}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoadingId === staff._id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Approve Staff Access</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECT REGISTRATION MODAL */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <UserX className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  Reject Staff Registration
                </h3>
              </div>
              <button
                onClick={() => setRejectModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to reject the registration for{' '}
                <strong>{rejectModalUser.fullName}</strong> ({rejectModalUser.email}). The user will not be able to log in.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Rejection (Included in notification email)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Employee ID does not match hospital HR records, or unauthorized staff registration."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === rejectModalUser._id}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoadingId === rejectModalUser._id ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
