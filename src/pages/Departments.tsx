import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Building2,
  FolderPlus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Users,
  User
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  managerId?: number;
  manager?: { id: number; firstName: string; lastName: string; email: string };
  _count?: { employees: number };
}

interface ManagerItem {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

const Departments: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    managerId: '',
  });

  const isHrOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'HR';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const deptRes = await api.get('/departments');
      setDepartments(deptRes.data);

      if (isHrOrAdmin) {
        // Load managers for dropdown
        const managerRes = await api.get('/employees/managers');
        setManagers(managerRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      managerId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      managerId: dept.managerId ? dept.managerId.toString() : '',
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
      managerId: formData.managerId ? parseInt(formData.managerId) : null,
    };

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, payload);
        setSuccess(`Department ${formData.name} updated successfully!`);
      } else {
        await api.post('/departments', payload);
        setSuccess(`Department ${formData.name} created successfully!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save department.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the department: "${name}"? This will unassign all its employees.`)) {
      try {
        setError(null);
        setSuccess(null);
        await api.delete(`/departments/${id}`);
        setSuccess(`Department "${name}" deleted successfully.`);
        fetchData();
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to delete department.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Departments Management</h1>
          <p className="text-slate-400 text-sm mt-1">Configure company structure and department leadership</p>
        </div>
        {isHrOrAdmin && (
          <button onClick={handleOpenAddModal} className="glass-button-primary">
            <FolderPlus size={16} />
            Create Department
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

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-slate-400">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400 rounded-xl text-sm border border-slate-900">
          No departments have been configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[220px]">
              <div>
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Building2 size={20} />
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">
                    {dept.code}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-200 mt-4 leading-tight">{dept.name}</h2>
                <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{dept.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-900 pt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={14} className="text-indigo-400" />
                  <span className="truncate max-w-[130px]">
                    {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    <Users size={14} className="text-indigo-400" />
                    <span>{dept._count?.employees || 0}</span>
                  </div>

                  {isHrOrAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingDept ? 'Modify Department' : 'Create New Department'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Department Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Engineering"
                  className="w-full glass-input text-sm py-2 px-3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Code (Abbreviation)</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="ENG"
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Department Head (Manager)</label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  >
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe the department's role and operations..."
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
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
