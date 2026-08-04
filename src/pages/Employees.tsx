import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Briefcase
} from 'lucide-react';

interface Employee {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dob?: string;
  dateOfJoining: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  baseSalary: number;
  departmentId?: number;
  department?: { id: number; name: string; code: string };
  managerId?: number;
  manager?: { id: number; firstName: string; lastName: string; email: string };
}

interface DropdownItem {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  code?: string;
  role?: string;
}

const Employees: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DropdownItem[]>([]);
  const [managers, setManagers] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dob: '',
    dateOfJoining: '',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    baseSalary: '45000',
    departmentId: '',
    managerId: '',
  });

  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);

      if (isHrOrAdmin) {
        const deptRes = await api.get('/departments');
        setDepartments(deptRes.data);

        const managerRes = await api.get('/employees/managers');
        setManagers(managerRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch employee list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      dob: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      baseSalary: '45000',
      departmentId: '',
      managerId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      email: emp.email,
      password: '', // Empty password means unchanged
      firstName: emp.firstName,
      lastName: emp.lastName,
      phone: emp.phone || '',
      address: emp.address || '',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      dateOfJoining: new Date(emp.dateOfJoining).toISOString().split('T')[0],
      role: emp.role,
      status: emp.status,
      baseSalary: emp.baseSalary.toString(),
      departmentId: emp.departmentId ? emp.departmentId.toString() : '',
      managerId: emp.managerId ? emp.managerId.toString() : '',
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      ...formData,
      baseSalary: parseFloat(formData.baseSalary),
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      managerId: formData.managerId ? parseInt(formData.managerId) : null,
    };

    try {
      if (editingEmployee) {
        // If password is empty, don't send it in update
        if (!formData.password) {
          delete (payload as any).password;
        }
        await api.put(`/employees/${editingEmployee.id}`, payload);
        setSuccess(`Employee ${formData.firstName} updated successfully!`);
      } else {
        await api.post('/employees', payload);
        setSuccess(`Employee ${formData.firstName} added successfully!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save employee.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        setError(null);
        setSuccess(null);
        await api.delete(`/employees/${id}`);
        setSuccess(`Employee ${name} deleted successfully.`);
        fetchData();
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to delete employee.');
      }
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.phone && emp.phone.includes(search));
    const matchesDept = deptFilter === '' || emp.departmentId === parseInt(deptFilter);
    const matchesRole = roleFilter === '' || emp.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Employee Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Manage personnel files, assignments, and roles</p>
        </div>
        {isHrOrAdmin && (
          <button onClick={handleOpenAddModal} className="glass-button-primary">
            <UserPlus size={16} />
            Add Employee
          </button>
        )}
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

      {/* Filters Area */}
      <div className="glass-panel p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 glass-input text-sm py-2"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Briefcase size={16} className="text-slate-500 shrink-0" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="glass-input text-xs py-2 w-full sm:w-36 px-2.5"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-slate-500 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="glass-input text-xs py-2 w-full sm:w-36 px-2.5"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-900">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading records...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No employees match this criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Manager</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Status</th>
                  {isHrOrAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[12px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{emp.department?.name || 'Unassigned'}</td>
                    <td className="py-4 px-6 text-slate-300">
                      {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'None'}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(emp.dateOfJoining).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    {isHrOrAdmin && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/20 text-xs">
                <span className="text-slate-400">
                  Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-semibold text-slate-200">
                    {Math.min(currentPage * itemsPerPage, filteredEmployees.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-200">{filteredEmployees.length}</span> employees
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-slate-400 font-medium px-2">
                    Page <span className="text-slate-200 font-semibold">{currentPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingEmployee ? 'Modify Employee Profile' : 'Register New Employee'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Password {editingEmployee && '(Leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder={editingEmployee ? '••••••••' : ''}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Monthly Salary ($)</label>
                  <input
                    type="number"
                    name="baseSalary"
                    required
                    value={formData.baseSalary}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Department</label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Manager</label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="">None</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    required
                    value={formData.dateOfJoining}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
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
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
