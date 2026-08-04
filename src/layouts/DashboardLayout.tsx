import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarRange,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  interface NotificationItem {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Leaves', path: '/leaves', icon: CalendarRange, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { name: 'Profile', path: '/profile', icon: User, roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  ];

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  const roleColors = {
    ADMIN: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    HR: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    MANAGER: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    EMPLOYEE: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
  };

  const renderNavLinks = () => (
    <nav className="space-y-1.5 px-3 py-6">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-200 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/50'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-slate-200/50 dark:border-slate-900">
        <div className="h-16 flex items-center px-6 border-b border-slate-200/60 dark:border-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
              E
            </div>
            <span className="font-bold text-[17px] tracking-wide text-slate-800 dark:text-white">EMPLOYEE ERP</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {renderNavLinks()}
        </div>

        <div className="p-4 border-t border-slate-200/60 dark:border-slate-900/60 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
              {user?.firstName ? user.firstName[0] : 'U'}{user?.lastName ? user.lastName[0] : ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
              E
            </div>
            <span className="font-bold text-[17px] tracking-wide text-slate-800 dark:text-white">EMPLOYEE ERP</span>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderNavLinks()}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            {user?.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                {user?.firstName ? user.firstName[0] : 'U'}{user?.lastName ? user.lastName[0] : ''}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 rounded-lg border border-transparent hover:border-rose-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-slate-200/60 dark:border-slate-900/60 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white hidden md:block">
              Welcome, {user?.firstName}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-all duration-300 relative flex items-center justify-center overflow-hidden w-9 h-9 shadow-sm"
              aria-label="Toggle theme"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <Sun
                  size={18}
                  className={`absolute transition-all duration-500 ease-spring ${
                    theme === 'light'
                      ? 'rotate-0 scale-100 opacity-100 text-amber-500'
                      : 'rotate-90 scale-0 opacity-0'
                  }`}
                />
                <Moon
                  size={18}
                  className={`absolute transition-all duration-500 ease-spring ${
                    theme === 'dark'
                      ? 'rotate-0 scale-100 opacity-100 text-indigo-400'
                      : '-rotate-90 scale-0 opacity-0'
                  }`}
                />
              </div>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-all relative flex items-center justify-center shadow-sm w-9 h-9"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-155">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 text-xs">No notifications yet.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                          className={`p-3.5 text-left cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            !notif.isRead ? 'bg-indigo-500/5 dark:bg-indigo-950/5' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-[11px] font-bold ${!notif.isRead ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {notif.title}
                            </span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider ${roleColors[user?.role || 'EMPLOYEE']}`}>
              {user?.role}
            </span>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Active Session</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
