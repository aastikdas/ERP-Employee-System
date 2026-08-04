import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Building2,
  Edit2,
  X
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY';
  remarks?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string };
  };
}

interface Department {
  id: number;
  name: string;
}

const calculateWorkingHours = (clockInStr: string, clockOutStr?: string): string => {
  if (!clockOutStr) return 'Active Shift';
  const inTime = new Date(clockInStr).getTime();
  const outTime = new Date(clockOutStr).getTime();
  const diffMs = outTime - inTime;
  if (diffMs <= 0) return '0h 0m';
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHrs}h ${diffMins}m`;
};

const Attendance: React.FC = () => {
  const { user } = useAuth();
  
  const [personalHistory, setPersonalHistory] = useState<AttendanceRecord[]>([]);
  const [companyShifts, setCompanyShifts] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Attendance actions
  const [clockLoading, setClockLoading] = useState(false);
  
  // Tabs State (for HR/Admin/Manager)
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');

  // Filters State for Company Table
  const [search, setSearch] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Edit Shift Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<AttendanceRecord | null>(null);
  const [formData, setFormData] = useState({
    status: 'PRESENT',
    remarks: '',
    clockIn: '',
    clockOut: '',
  });

  const isManagement = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';
  const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const historyRes = await api.get('/attendance/history');
      setPersonalHistory(historyRes.data);

      if (isManagement) {
        const params: any = {};
        if (startDateFilter) params.startDate = startDateFilter;
        if (endDateFilter) params.endDate = endDateFilter;
        if (selectedDeptId) params.departmentId = selectedDeptId;
        const companyRes = await api.get('/attendance/today', { params });
        setCompanyShifts(companyRes.data);
      }

      if (isHrOrAdmin) {
        const deptRes = await api.get('/departments');
        setDepartments(deptRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Re-run search query when date filters or department changes
  useEffect(() => {
    if (isManagement) {
      const getFilteredShifts = async () => {
        try {
          const params: any = {};
          if (startDateFilter) params.startDate = startDateFilter;
          if (endDateFilter) params.endDate = endDateFilter;
          if (selectedDeptId) params.departmentId = selectedDeptId;
          const companyRes = await api.get('/attendance/today', { params });
          setCompanyShifts(companyRes.data);
        } catch (err) {
          console.error('Filter query error:', err);
        }
      };
      getFilteredShifts();
    }
  }, [startDateFilter, endDateFilter, selectedDeptId]);

  const handleClockIn = async () => {
    setClockLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/attendance/clock-in');
      setSuccess(res.data.message || 'Clocked in successfully.');
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Clock-in failed.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post('/attendance/clock-out');
      setSuccess(res.data.message || 'Clocked out successfully.');
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Clock-out failed.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleOpenEditModal = (shift: AttendanceRecord) => {
    setEditingShift(shift);
    setFormData({
      status: shift.status,
      remarks: shift.remarks || '',
      clockIn: new Date(shift.clockIn).toISOString().slice(0, 16),
      clockOut: shift.clockOut ? new Date(shift.clockOut).toISOString().slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    setError(null);
    setSuccess(null);

    const payload = {
      status: formData.status,
      remarks: formData.remarks,
      clockIn: new Date(formData.clockIn).toISOString(),
      clockOut: formData.clockOut ? new Date(formData.clockOut).toISOString() : null,
    };

    try {
      await api.put(`/attendance/${editingShift.id}`, payload);
      setSuccess('Attendance shift record updated successfully.');
      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update shift.');
    }
  };

  // Determine if already clocked in / out today
  const hasClockedInToday = personalHistory.length > 0 && 
    new Date(personalHistory[0].date).toDateString() === new Date().toDateString();
  const hasClockedOutToday = hasClockedInToday && !!personalHistory[0].clockOut;

  // Filter shifts locally by employee search query
  const filteredShifts = companyShifts.filter((shift) => {
    if (!shift.employee) return false;
    const name = `${shift.employee.firstName} ${shift.employee.lastName}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || shift.employee.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Record shifts, review timestamps, and track punch-card accuracy</p>
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

      {/* Clock Controls Card */}
      <div className="glass-card rounded-xl p-5 border border-slate-900 bg-gradient-to-br from-slate-900/40 to-slate-950/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Shift Console</h2>
              <p className="text-slate-400 text-xs mt-1">Clock in/out to stamp timestamps for payroll auditing.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleClockIn}
              disabled={clockLoading || hasClockedInToday}
              className="glass-button-primary"
            >
              {clockLoading ? 'Clocking in...' : hasClockedInToday ? 'Shift Logged' : 'Clock In Shift'}
            </button>
            <button
              onClick={handleClockOut}
              disabled={clockLoading || !hasClockedInToday || hasClockedOutToday}
              className="glass-button-secondary"
            >
              {clockLoading ? 'Clocking out...' : hasClockedOutToday ? 'Shift Completed' : 'Clock Out Shift'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isManagement && (
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'personal'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Shift History
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'company'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Today's Employee Shifts
          </button>
        </div>
      )}

      {/* TABS CONTENT */}
      {activeTab === 'personal' ? (
        /* PERSONAL HISTORY TABLE */
        <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Shift Logs History</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading logs...</div>
          ) : personalHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No shifts logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Shift Date</th>
                    <th className="py-4 px-6">Clock In</th>
                    <th className="py-4 px-6">Clock Out</th>
                    <th className="py-4 px-6">Working Hours</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {personalHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-6 font-medium text-slate-200">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200">
                        {new Date(log.clockIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {log.clockOut 
                          ? new Date(log.clockOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : <span className="text-slate-500">Active Shift</span>
                        }
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {calculateWorkingHours(log.clockIn, log.clockOut)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          log.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          log.status === 'HALF_DAY' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">{log.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* COMPANY SHIFTS TABLE */
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee shifts..."
                className="w-full pl-10 glass-input text-sm py-2"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex items-center gap-1.5 text-slate-400">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="glass-input text-[11px] py-1.5 px-2 bg-slate-950/80 border-slate-800"
                />
                <span className="text-[10px] uppercase text-slate-500 font-semibold px-0.5">to</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="glass-input text-[11px] py-1.5 px-2 bg-slate-950/80 border-slate-800"
                />
              </div>

              {isHrOrAdmin && (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-slate-500" />
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="glass-input text-xs py-1.5 px-2.5 bg-slate-950/80 border-slate-800"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
            {filteredShifts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No employee shifts recorded today.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Clock In</th>
                      <th className="py-4 px-6">Clock Out</th>
                      <th className="py-4 px-6">Working Hours</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {filteredShifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          {shift.employee ? (
                            <div>
                              <p className="font-semibold text-slate-200">
                                {shift.employee.firstName} {shift.employee.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{shift.employee.email}</p>
                            </div>
                          ) : 'Unknown'}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {shift.employee?.department?.name || 'Unassigned'}
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-200">
                          {new Date(shift.clockIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-6 font-mono">
                          {shift.clockOut
                            ? new Date(shift.clockOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                            : <span className="text-slate-500">Active Shift</span>
                          }
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">
                          {calculateWorkingHours(shift.clockIn, shift.clockOut)}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            shift.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                            shift.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                            shift.status === 'HALF_DAY' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          }`}>
                            {shift.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs truncate max-w-[200px]" title={shift.remarks}>
                          {shift.remarks || '-'}
                        </td>
                        {isHrOrAdmin && (
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenEditModal(shift)}
                              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {isModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Modify Attendance Shift</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateShift} className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Updating shift record for{' '}
                <span className="font-semibold text-slate-200">
                  {editingShift.employee?.firstName} {editingShift.employee?.lastName}
                </span>{' '}
                on {new Date(editingShift.date).toLocaleDateString()}.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-400">Shift Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Clock In Time</label>
                  <input
                    type="datetime-local"
                    name="clockIn"
                    required
                    value={formData.clockIn}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Clock Out Time</label>
                  <input
                    type="datetime-local"
                    name="clockOut"
                    value={formData.clockOut}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Remarks</label>
                <textarea
                  name="remarks"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleFormChange}
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
                <button type="submit" className="glass-button-primary py-2 px-6">
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
