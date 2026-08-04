import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  CheckCircle,
  AlertCircle,
  Building,
  KeyRound
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  
  // Profile Info Form
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
  });

  // Password Form
  const [passForm, setPassForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({
      ...passForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put(`/employees/${user.id}`, profileForm);
      updateCurrentUser(res.data);
      setSuccess('Profile information updated successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passForm.password !== passForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/employees/${user.id}`, { password: passForm.password });
      setSuccess('Password updated successfully.');
      setPassForm({ password: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post(`/employees/${user.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateCurrentUser(res.data.user);
      setSuccess('Profile picture uploaded successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Personal Account</h1>
        <p className="text-slate-400 text-sm mt-1">Review organizational details and update credentials</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card & Org Info */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 md:col-span-1 h-fit space-y-6">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4 group cursor-pointer">
              {user?.avatar ? (
                <img
                  src={`http://localhost:5000${user.avatar}`}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-2 border-indigo-500/20"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-600/10 border-2 border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-2xl">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
              )}
              
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="text-[10px] text-white font-bold">{uploading ? '...' : 'Upload'}</span>
              </label>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-bold tracking-wider uppercase mt-2">
              {user?.role}
            </span>
          </div>

          <div className="border-t border-slate-800/80 pt-6 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <Building size={14} className="text-slate-500" />
              <span>Department: <span className="font-semibold text-slate-200">{user?.department?.name || 'Unassigned'}</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <User size={14} className="text-slate-500" />
              <span>Report To: <span className="font-semibold text-slate-200">{user?.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'Direct Directory'}</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-slate-500" />
              <span>Joined: <span className="font-semibold text-slate-200">{user?.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '-'}</span></span>
            </div>
          </div>
        </div>

        {/* Update Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile details */}
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Contact Profile Details</h3>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={profileForm.dob}
                    onChange={handleProfileChange}
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Home Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  className="w-full glass-input text-sm py-2 px-3"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary px-6 py-2.5 text-xs font-bold"
              >
                {loading ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center gap-2">
              <KeyRound size={15} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Change Password Credentials</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">New Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={passForm.password}
                    onChange={handlePassChange}
                    placeholder="••••••••"
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={passForm.confirmPassword}
                    onChange={handlePassChange}
                    placeholder="••••••••"
                    className="w-full glass-input text-sm py-2 px-3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary px-6 py-2.5 text-xs font-bold"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
