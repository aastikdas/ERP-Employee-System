import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  DollarSign,
  Briefcase,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  X,
  CreditCard,
  ChevronDown
} from 'lucide-react';

interface PayrollRecord {
  id: number;
  month: number;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PAID';
  paymentDate?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: { name: string };
  };
  processedBy?: { firstName: string; lastName: string };
}

const Payroll: React.FC = () => {
  const { user } = useAuth();
  
  const [personalPayslips, setPersonalPayslips] = useState<PayrollRecord[]>([]);
  const [allTransactions, setAllTransactions] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'my-slips' | 'admin-payroll'>('my-slips');

  // Generate Payroll Form State
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth() + 1, // default current month
    year: new Date().getFullYear(),
  });

  const [generateLoading, setGenerateLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Slip View Modal State
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);

      const personalRes = await api.get('/payroll/my-payslips');
      setPersonalPayslips(personalRes.data);

      if (isHrOrAdmin) {
        const allRes = await api.get('/payroll/all');
        setAllTransactions(allRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch payroll information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/payroll/generate', generateForm);
      setSuccess(res.data.message || 'Payroll generated successfully for the selected period.');
      fetchPayroll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handlePayStatusUpdate = async (id: number, status: 'PAID' | 'PENDING') => {
    setActionLoadingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put(`/payroll/${id}/status`, { status });
      setSuccess(res.data.message || 'Payment status updated successfully.');
      fetchPayroll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenSlipModal = (slip: PayrollRecord) => {
    setSelectedSlip(slip);
    setIsSlipModalOpen(true);
  };

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Payroll & Compensations</h1>
        <p className="text-slate-400 text-sm mt-1">Audit payslips, generate monthly payroll cycles, and record bank transfers</p>
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

      {/* Tabs */}
      {isHrOrAdmin && (
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('my-slips')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'my-slips'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Salary Slips
          </button>
          <button
            onClick={() => setActiveTab('admin-payroll')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'admin-payroll'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Organizational Payroll
          </button>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'my-slips' ? (
        /* MY SALARY SLIPS PANEL */
        <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Payslip Receipts Log</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading payslips...</div>
          ) : personalPayslips.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No payslips have been issued to your account yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                    <th className="py-4 px-6">Payment Period</th>
                    <th className="py-4 px-6">Base Salary</th>
                    <th className="py-4 px-6">Allowances</th>
                    <th className="py-4 px-6">Deductions</th>
                    <th className="py-4 px-6">Net Take-Home</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {personalPayslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        {monthNames[slip.month]} {slip.year}
                      </td>
                      <td className="py-4 px-6">${slip.baseSalary.toLocaleString()}</td>
                      <td className="py-4 px-6 text-emerald-400">+${slip.allowances.toLocaleString()}</td>
                      <td className="py-4 px-6 text-rose-400">-${slip.deductions.toLocaleString()}</td>
                      <td className="py-4 px-6 font-bold text-slate-100">${slip.netSalary.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          slip.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenSlipModal(slip)}
                          className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 inline-flex"
                        >
                          <FileText size={13} />
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ADMIN/HR ORGANIZATIONAL PAYROLL */
        <div className="space-y-6">
          {/* Generate Panel */}
          <div className="glass-card rounded-xl p-5 border border-slate-900">
            <div className="flex items-center gap-2.5 mb-4">
              <Play size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Run Payroll Cycle</h3>
            </div>
            
            <form onSubmit={handleGeneratePayroll} className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 w-full sm:w-44">
                <label className="text-xs font-semibold text-slate-400">Select Month</label>
                <select
                  name="month"
                  value={generateForm.month}
                  onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
                  className="w-full glass-input text-xs py-2 px-2.5"
                >
                  {monthNames.map((name, index) => index > 0 && (
                    <option key={index} value={index}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 w-full sm:w-36">
                <label className="text-xs font-semibold text-slate-400">Select Year</label>
                <select
                  name="year"
                  value={generateForm.year}
                  onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
                  className="w-full glass-input text-xs py-2 px-2.5"
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generateLoading}
                className="glass-button-primary py-2 px-5 text-xs font-bold"
              >
                {generateLoading ? 'Running calculations...' : 'Execute Payroll Cycle'}
              </button>
            </form>
          </div>

          {/* Transactions Table */}
          <div className="glass-panel rounded-xl border border-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Salary Disbursements ledger</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading records...</div>
            ) : allTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No disbursements found. Run a payroll cycle above.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Period</th>
                      <th className="py-4 px-6">Base Salary</th>
                      <th className="py-4 px-6">Disbursed net</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {allTransactions.map((slip) => (
                      <tr key={slip.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-6">
                          {slip.employee ? (
                            <div>
                              <p className="font-semibold text-slate-200">
                                {slip.employee.firstName} {slip.employee.lastName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {slip.employee.department?.name || 'Unassigned'} • {slip.employee.role}
                              </p>
                            </div>
                          ) : 'Unknown'}
                        </td>
                        <td className="py-4 px-6 font-medium">
                          {monthNames[slip.month]} {slip.year}
                        </td>
                        <td className="py-4 px-6">${slip.baseSalary.toLocaleString()}</td>
                        <td className="py-4 px-6 font-bold text-slate-100">${slip.netSalary.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            slip.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          }`}>
                            {slip.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSlipModal(slip)}
                              className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs"
                            >
                              Details
                            </button>
                            {slip.status === 'PENDING' && (
                              <button
                                onClick={() => handlePayStatusUpdate(slip.id, 'PAID')}
                                disabled={actionLoadingId === slip.id}
                                className="p-1 px-2.5 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs flex items-center gap-1"
                              >
                                <CreditCard size={11} />
                                Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salary Slip Invoice Modal */}
      {isSlipModalOpen && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between no-print">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Salary Statement Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-slate-400 hover:text-white p-1"
                  title="Print Slip"
                >
                  <Printer size={18} />
                </button>
                <button onClick={() => setIsSlipModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="p-8 space-y-6 text-slate-300 font-sans" id="salary-slip">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-extrabold text-[12px] text-white">E</div>
                    <span className="font-bold text-slate-200 text-sm tracking-wide">ENTERPRISE ERP INC.</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">100 Tech Parkway, Suite 500, Silicon Valley</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Statement</span>
                  <p className="text-xs font-bold text-indigo-400 mt-1 font-mono">SLIP-#{selectedSlip.id}</p>
                </div>
              </div>

              {/* Employee & Cycle Details */}
              <div className="grid grid-cols-2 gap-y-3.5 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <div>
                  <p className="text-slate-500 font-medium">Employee Name</p>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {selectedSlip.employee ? `${selectedSlip.employee.firstName} ${selectedSlip.employee.lastName}` : `${user?.firstName} ${user?.lastName}`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Pay Period</p>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {monthNames[selectedSlip.month]} {selectedSlip.year}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Department</p>
                  <p className="font-semibold text-slate-300 mt-0.5">
                    {selectedSlip.employee?.department?.name || user?.department?.name || 'General Operations'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Role Assignment</p>
                  <p className="font-semibold text-slate-300 mt-0.5">
                    {selectedSlip.employee?.role || user?.role}
                  </p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="px-3.5 py-2.5 bg-slate-950/40 font-semibold border-b border-slate-800 text-slate-200">
                    Earnings
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Basic Base Salary</span>
                      <span className="font-semibold text-slate-200">${selectedSlip.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Housing Allowance</span>
                      <span className="font-semibold text-emerald-400">+${(selectedSlip.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-950/20 border-t border-slate-800 flex justify-between font-bold">
                    <span>Total Earnings</span>
                    <span className="text-slate-200">${(selectedSlip.baseSalary + selectedSlip.allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="px-3.5 py-2.5 bg-slate-950/40 font-semibold border-b border-slate-800 text-slate-200">
                    Deductions
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Federal Tax & Social</span>
                      <span className="font-semibold text-rose-400">-${selectedSlip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-950/20 border-t border-slate-800 flex justify-between font-bold">
                    <span>Total Deductions</span>
                    <span className="text-slate-200">${selectedSlip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Summary */}
              <div className="flex justify-between items-center bg-indigo-950/20 border border-indigo-900/30 p-5 rounded-xl">
                <div>
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Net Take-Home Salary</p>
                  <p className="text-[10px] text-slate-400 mt-1">Disbursed via electronic bank transfer</p>
                </div>
                <p className="text-2xl font-bold text-white font-mono">
                  ${selectedSlip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Status and Footer */}
              <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-5">
                <div>
                  <span className="text-slate-500">Statement Audited By:</span>
                  <p className="font-medium text-slate-400 mt-0.5">
                    {selectedSlip.processedBy ? `${selectedSlip.processedBy.firstName} ${selectedSlip.processedBy.lastName}` : 'System Payroll'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 font-medium">Transfer Status:</span>
                  <span className={`block font-bold text-sm tracking-wide mt-0.5 ${
                    selectedSlip.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {selectedSlip.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
