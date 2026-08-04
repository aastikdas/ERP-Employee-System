import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Building2,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  UserCheck,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface StatsData {
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  stats: any;
  charts?: any;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Attendance Clock-in State for Employee Dashboard
  const [clockLoading, setClockLoading] = useState(false);
  const [clockMsg, setClockMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setData(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClockIn = async () => {
    setClockLoading(true);
    setClockMsg(null);
    try {
      const res = await api.post('/attendance/clock-in');
      setClockMsg({ type: 'success', text: res.data.message || 'Clock-in successful!' });
      fetchStats(); // Reload stats to refresh status
    } catch (err: any) {
      setClockMsg({ type: 'error', text: err.response?.data?.message || 'Clock-in failed.' });
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    setClockMsg(null);
    try {
      const res = await api.post('/attendance/clock-out');
      setClockMsg({ type: 'success', text: res.data.message || 'Clock-out successful!' });
      fetchStats(); // Reload stats to refresh status
    } catch (err: any) {
      setClockMsg({ type: 'error', text: err.response?.data?.message || 'Clock-out failed.' });
    } finally {
      setClockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-400 font-medium">Analyzing dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle size={20} />
        <span>{error || 'Error loading dashboard.'}</span>
      </div>
    );
  }

  const { stats, charts } = data;
  const recentShifts = (data as any).recentShifts || [];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-sm font-bold" style={{ color: pld.color || pld.fill }}>
              {pld.name}: {pld.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time statistics and corporate directory analytics</p>
      </div>

      {/* 1. ADMIN & HR VIEW */}
      {(user?.role === 'ADMIN' || user?.role === 'HR') && (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Users size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Employees</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalEmployees}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Departments</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalDepartments}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Pending Leaves</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pendingLeaves}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <UserCheck size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Attendance Rate</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.attendanceRate}%</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Payroll Cost</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${stats.lastPayrollCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Today's Attendance Status Sub-grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-emerald-500/10 bg-emerald-950/5">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <UserCheck size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Present Today</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.presentToday}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-amber-500/10 bg-amber-950/5">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Late Today</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.lateToday}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-rose-500/10 bg-rose-950/5">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <XCircle size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Absent Today</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.absentToday}</p>
              </div>
            </div>
          </div>

          {/* Leaves Status Sub-grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-amber-500/10 bg-amber-950/5">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Pending Leaves</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pendingLeaves}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-emerald-500/10 bg-emerald-950/5">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Approved Leaves</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.approvedLeaves}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4 border-rose-500/10 bg-rose-950/5">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Rejected Leaves</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.rejectedLeaves}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Department Distribution (Pie) */}
            <div className="glass-card rounded-xl p-6 flex flex-col h-[380px]">
              <h2 className="text-[15px] font-bold text-slate-200 mb-4 uppercase tracking-wider">
                Employees by Department
              </h2>
              <div className="flex-1 min-h-0 relative">
                {charts?.deptDistribution && charts.deptDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.deptDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {charts.deptDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No department data.
                  </div>
                )}
              </div>
            </div>

            {/* Payroll Cost Trend (Line) */}
            <div className="glass-card rounded-xl p-6 flex flex-col h-[380px] xl:col-span-2">
              <h2 className="text-[15px] font-bold text-slate-200 mb-4 uppercase tracking-wider">
                Monthly Salary Payouts Trend
              </h2>
              <div className="flex-1 min-h-0">
                {charts?.payrollTrend && charts.payrollTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.payrollTrend} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        name="Total Payroll"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No payroll trend history yet.
                  </div>
                )}
              </div>
            </div>

            {/* Leaves request status distribution (Bar) */}
            <div className="glass-card rounded-xl p-6 flex flex-col h-[380px] xl:col-span-3">
              <h2 className="text-[15px] font-bold text-slate-200 mb-4 uppercase tracking-wider">
                Leave Request Volume
              </h2>
              <div className="flex-1 min-h-0">
                {charts?.leaveDistribution && charts.leaveDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.leaveDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="status" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Leave Count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {charts.leaveDistribution.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.status === 'APPROVED' ? '#10b981' : 
                              entry.status === 'PENDING' ? '#f59e0b' : '#f43f5e'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No leave requests found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. MANAGER VIEW */}
      {user?.role === 'MANAGER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Direct Reports</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalSubordinates}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Subordinates Present Today</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {Math.round(stats.totalSubordinates * (stats.attendanceRate / 100))} ({stats.attendanceRate}%)
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Report Leave Requests</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pendingLeaves}</p>
              </div>
            </div>
          </div>

          {/* Manager Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Attendance status Pie */}
            <div className="glass-card rounded-xl p-6 flex flex-col h-[320px]">
              <h2 className="text-[14px] font-bold text-slate-200 mb-4 uppercase tracking-wider">
                Today's Team Shift Attendance
              </h2>
              <div className="flex-1 min-h-0 relative">
                {charts?.teamAttendanceStatus && charts.teamAttendanceStatus.some((e: any) => e.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.teamAttendanceStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {charts.teamAttendanceStatus.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'Present' ? '#10b981' : 
                              entry.name === 'Late' ? '#f59e0b' : '#f43f5e'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No active shift records for direct reports today.
                  </div>
                )}
              </div>
            </div>

            {/* Team Leaves volume Bar */}
            <div className="glass-card rounded-xl p-6 flex flex-col h-[320px]">
              <h2 className="text-[14px] font-bold text-slate-200 mb-4 uppercase tracking-wider">
                Subordinates Leave Volumes
              </h2>
              <div className="flex-1 min-h-0">
                {charts?.leaveDistribution && charts.leaveDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.leaveDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="status" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Leaves Volume" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {charts.leaveDistribution.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.status === 'APPROVED' ? '#10b981' : 
                              entry.status === 'PENDING' ? '#f59e0b' : '#f43f5e'
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    No leave requests logged by subordinates.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPLOYEE & DUAL INTERACTIVE CLOCK CARD */}
      {user?.role === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Clock Control Card */}
          <div className="glass-card rounded-xl p-6 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 dark:from-indigo-950/20 to-slate-100/50 dark:to-slate-900/60 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Workforce Shift Log
              </h2>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Log daily shifts by clicking the buttons below. In-office logs are tracked based on shift policy. 
              Late clock-ins after 9:30 AM will be automatically flagged for HR audit.
            </p>

            {clockMsg && (
              <div className={`p-3.5 rounded-lg text-sm mb-6 flex items-center gap-2.5 ${
                clockMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {clockMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{clockMsg.text}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleClockIn}
                disabled={clockLoading || stats.todayStatus !== 'NOT_CLOCKED_IN'}
                className="glass-button-primary px-6 py-3 font-semibold disabled:bg-indigo-50 dark:disabled:bg-indigo-900/10 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 border border-indigo-500/20"
              >
                {clockLoading ? 'Processing...' : 'Clock In Shift'}
              </button>
              
              <button
                onClick={handleClockOut}
                disabled={clockLoading || stats.todayStatus === 'NOT_CLOCKED_IN' || (stats.todayStatus !== 'NOT_CLOCKED_IN' && stats.clockOutTime !== null)}
                className="glass-button-secondary px-6 py-3 font-semibold disabled:bg-slate-100 dark:disabled:bg-slate-900/10 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 border border-slate-200 dark:border-slate-800"
              >
                {clockLoading ? 'Processing...' : 'Clock Out Shift'}
              </button>
            </div>

            {/* Current day status tags */}
            <div className="mt-6 flex flex-wrap gap-6 text-[13px] border-t border-slate-200 dark:border-slate-800/60 pt-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Today's Status: </span>
                <span className={`font-semibold ml-1.5 ${
                  stats.todayStatus === 'PRESENT' ? 'text-emerald-600 dark:text-emerald-400' :
                  stats.todayStatus === 'LATE' ? 'text-amber-600 dark:text-amber-400' :
                  stats.todayStatus === 'HALF_DAY' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500'
                }`}>
                  {stats.todayStatus.replace('_', ' ')}
                </span>
              </div>
              {stats.clockInTime && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">In: </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold ml-1">
                    {new Date(stats.clockInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {stats.clockOutTime && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Out: </span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold ml-1">
                    {new Date(stats.clockOutTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 gap-5">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wider">Attendances Logged</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalAttendances} Days</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Payslips Issued</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalPayslips} Slips</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wider">Pending Leaves</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.pendingLeaves} Requested</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle size={22} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wider">Approved Leaves</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.approvedLeaves} Approved</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium tracking-wider">Rejected Leaves</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.rejectedLeaves} Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
