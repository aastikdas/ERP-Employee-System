import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  CalendarDays,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  X
} from 'lucide-react';

interface LeaveRecord {
  id: number;
  startDate: string;
  endDate: string;
  type: 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  approvedBy?: { firstName: string; lastName: string };
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
  };
}

const Leaves: React.FC = () => {
  const { user } = useAuth();
  
  const [personalHistory, setPersonalHistory] = useState<LeaveRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'approvals'>('my-leaves');

  // Request Leave Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'CASUAL',
    reason: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [approvalLoadingId, setApprovalLoadingId] = useState<number | null>(null);

  const isManagement = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const personalRes = await api.get('/leaves/my-leaves');
      setPersonalHistory(personalRes.data);

      if (isManagement) {
        const pendingRes = await api.get('/leaves/pending');
        setPendingRequests(pendingRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/leaves/apply', formData);
      setSuccess(res.data.message || 'Leave request submitted successfully.');
      setIsModalOpen(false);
      fetchLeaves();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setApprovalLoadingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put(`/leaves/${id}/status`, { status });
      setSuccess(res.data.message || `Leave request ${status.toLowerCase()} successfully.`);
      fetchLeaves();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update leave request status.');
    } finally {
      setApprovalLoadingId(null);
    }
  };

  const handleCancelLeave = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        setError(null);
        setSuccess(null);
        await api.delete(`/leaves/${id}`);
        setSuccess('Leave request cancelled successfully.');
        fetchLeaves();
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to cancel leave request.');
      }
    }
  };

  // Compute stats: e.g. sick leave count, casual leave count, earned leave count
  const approvedLeaves = personalHistory.filter(l => l.status === 'APPROVED');
  const countDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays;
  };

  const sickDays = approvedLeaves.filter(l => l.type === 'SICK').reduce((sum, l) => sum + countDays(l.startDate, l.endDate), 0);
  const casualDays = approvedLeaves.filter(l => l.type === 'CASUAL').reduce((sum, l) => sum + countDays(l.startDate, l.endDate), 0);
  const earnedDays = approvedLeaves.filter(l => l.type === 'EARNED').reduce((sum, l) => sum + countDays(l.startDate, l.endDate), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Time Off & Leaves</h1>
          <p className="text-slate-400 text-sm mt-1">Submit leave requests and audit department absences</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="glass-button-primary">
          <Send size={16} />
          Request Leave
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2.5">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2.5">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Quotas grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-xl p-5 border border-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Casual Leaves Taken</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">Max 12/yr</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{casualDays} Days</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sick Leaves Taken</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Max 10/yr</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{sickDays} Days</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Earned Leaves Taken</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">Max 15/yr</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{earnedDays} Days</p>
        </div>
      </div>

      {/* Tabs */}
      {isManagement && (
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'my-leaves'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Time Off History
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'approvals'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Leave Approvals ({pendingRequests.length})
          </button>
        </div>
      )}

      {/* Tabs Content */}
      {activeTab === 'my-leaves' ? (
        /* PERSONAL LEAVE REQUESTS */
        <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Time Off Request Logs</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading requests...</div>
          ) : personalHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No leave requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Leave Duration</th>
                    <th className="py-4 px-6">Days</th>
                    <th className="py-4 px-6">Leave Type</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6">Approved By</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {personalHistory.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-6 font-medium text-slate-200">
                        {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                        {new Date(leave.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">{countDays(leave.startDate, leave.endDate)} Days</td>
                      <td className="py-4 px-6 text-slate-300">
                        <span className="text-[11px] font-medium text-slate-400 border border-slate-700 bg-slate-900 px-2 py-0.5 rounded">
                          {leave.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          leave.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          leave.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs max-w-[200px] truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {leave.approvedBy ? `${leave.approvedBy.firstName} ${leave.approvedBy.lastName}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {leave.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelLeave(leave.id)}
                            className="px-2.5 py-1 text-xs bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 rounded-lg font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* PENDING REQUESTS FOR MANAGERS/HR */
        <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Pending Leave Approval Center</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading pending logs...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No pending leave requests to review.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {pendingRequests.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-6">
                        {leave.employee ? (
                          <div>
                            <p className="font-semibold text-slate-200">
                              {leave.employee.firstName} {leave.employee.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{leave.employee.email}</p>
                          </div>
                        ) : 'Unknown'}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-200">
                        {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                        {new Date(leave.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}{' '}
                        ({countDays(leave.startDate, leave.endDate)} Days)
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[11px] font-medium text-slate-400 border border-slate-700 bg-slate-900 px-2 py-0.5 rounded">
                          {leave.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs max-w-[220px] truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                            disabled={approvalLoadingId === leave.id}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all flex items-center gap-1 text-[11px]"
                          >
                            <ThumbsUp size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                            disabled={approvalLoadingId === leave.id}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all flex items-center gap-1 text-[11px]"
                          >
                            <ThumbsDown size={12} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Apply for Time Off</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Leave Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full glass-input text-sm py-2 px-3"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Reason</label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Detail the reason for your time off request..."
                  className="w-full glass-input text-sm py-2 px-3"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-button-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="glass-button-primary py-2 px-6"
                >
                  {formLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
